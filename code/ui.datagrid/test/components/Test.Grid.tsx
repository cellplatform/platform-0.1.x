import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, map, takeUntil, debounceTime, delay } from 'rxjs/operators';

import {
  R,
  COLORS,
  Button,
  color,
  css,
  GlamorValue,
  Hr,
  log,
  ObjectView,
  t,
  testData,
  value,
  coord,
  time,
} from '../common';
import { TestGridView, DEFAULT } from './Test.Grid.view';

export type ITestGridProps = {
  editorType: t.TestEditorType;
  style?: GlamorValue;
};
export type ITestGridState = {
  data?: any;
  refs?: any; // TEMP 🐷
  totalColumns?: number;
  totalRows?: number;
};

export class TestGrid extends React.PureComponent<ITestGridProps, ITestGridState> {
  public state: ITestGridState = {};
  private unmounted$ = new Subject<{}>();
  private state$ = new Subject<Partial<ITestGridState>>();
  private events$ = new Subject<t.GridEvent>();

  private testGrid!: TestGridView;
  private testGridRef = (ref: TestGridView) => (this.testGrid = ref);

  private refTable = coord.refs.table({
    getKeys: async () => Object.keys(this.grid.values),
    getValue: async key => {
      const cell = this.grid.values[key];
      return cell && typeof cell.value === 'string' ? cell.value : undefined;
    },
  });

  /**
   * [Lifecycle]
   */
  public componentWillMount() {
    // Update state.
    const state$ = this.state$.pipe(takeUntil(this.unmounted$));
    state$.subscribe(e => this.setState(e));

    /**
     * Grid events.
     */
    const events$ = this.events$.pipe(takeUntil(this.unmounted$));
    events$
      .pipe(
        filter(() => true),
        filter(e => e.type === 'GRID/cells/change'),
        map(e => e.payload as t.IGridCellsChange),
        delay(0),
      )
      .subscribe(async e => {
        log.info('🐷 IGridCellsChanged', e);

        /**
         * update({key: 'A1' })
         * - 1. get cached incoming/outgoing cell refs.
         * - 2. recalculate outgoing on A1
         * - 3. combine new out-refs with (1).
         * - 4. recalculate list.
         *
         */
        const update = async (args: {
          key: string;
          from?: string;
          to?: string;
          table: t.IRefsTable;
        }): Promise<t.RefsUpdateResponse> => {
          const { key, table } = args;

          // Calculate set of existing refs (IN/OUT) prior to any updates.
          const pathToKeys = (path?: string) => (path || '').split('/').filter(part => part);
          const incomingToKeys = (refs: t.IRefIn[] = []) => refs.map(ref => ref.cell);
          const outgoingToKeys = (refs: t.IRefOut[] = []) =>
            R.flatten(refs.map(ref => pathToKeys(ref.path)));

          const refsToKeys = (refs: t.IRefs) => {
            const inKeys = Object.keys(refs.in)
              .map(key => ({ key, refs: incomingToKeys(refs.in[key]) }))
              .filter(e => e.refs.includes(args.key))
              .map(e => e.key);
            const outRefs = R.flatten(Object.keys(refs.out).map(key => refs.out[key]));
            const outKeys = outgoingToKeys(outRefs);
            return R.uniq([...inKeys, ...outKeys]);
          };

          const beforeRefs = await table.refs(); // NB: Not forced, pick up from cache.
          let refresh: string[] = refsToKeys(beforeRefs);

          // Perform update of OUTGOING refs of the given cell.
          const outRefs = await table.outgoing({ range: key, force: true });

          // Add all OUTGOING keys derived from the update.
          Object.keys(outRefs).forEach(key => {
            outRefs[key].forEach(item => {
              refresh = [...refresh, ...pathToKeys(item.path)];
            });
          });
          refresh = R.uniq(refresh);

          // Perform a forced update of all INCOMING/OUTGOING refs implicated in the change.
          const refs = await table.refs({ range: refresh, force: true });

          // Read out any errors that may exist after the update.
          const errors: t.IRefError[] = R.flatten(
            Object.keys(refs.out)
              .map(key => refs.out[key])
              .map(refs => refs.map(ref => ref.error as t.IRefError)),
          ).filter(err => err);

          // Finish up.
          const res: t.RefsUpdateResponse = {
            ok: errors.length === 0,
            updated: key,
            keys: refresh,
            refs,
            errors,
          };
          return res;
        };

        // Update refs for individual change.
        const wait = e.changes
          .filter(e => e.isChanged)
          .map(async change => {
            const key = change.cell.key;
            const table = this.refTable;

            const toValue = (data?: t.IGridCell) =>
              data && data.value ? data.value.toString() : undefined;
            const from = toValue(change.value.from);
            const to = toValue(change.value.to);
            const res = await update({ key, from, to, table });

            console.group('🌳 ', key);
            console.log('change', change);
            console.log('update', res);
            console.groupEnd();
          });
        await Promise.all(wait);
        this.updateRefs(); // TEMP 🐷

        // e.cancel();
        // e.changes[0].modify('foo');

        // console.log('🌳', e.type, e.payload);
        // const change = e.payload as t.IGridCellChange;
        // change.modify('hello');
      });

    events$
      .pipe(
        filter(() => true),
        filter(e => e.type === 'GRID/EDITOR/end'), // Filter
        map(e => e.payload as t.IEndEditing),
      )
      .subscribe(e => {
        // console.log('cancel edit');
        // e.cancel();
      });

    const command$ = events$.pipe(
      filter(e => e.type === 'GRID/command'),
      map(e => e.payload as t.IGridCommand),
    );

    command$.subscribe(e => {
      log.info('🐷 COMMAND:', e.command, e);
    });

    events$
      .pipe(
        filter(e => e.type === 'GRID/clipboard'),
        map(e => e.payload as t.IGridClipboard),
      )
      .subscribe(e => {
        log.info('📋 CLIPBOARD', e);
      });

    events$
      .pipe(
        filter(e => e.type === 'GRID/clipboard/before/paste'),
        map(e => e.payload as t.IGridClipboardBeforePaste),
      )
      .subscribe(e => {
        if (e.pending) {
          // Modify clipboard before paste.
          // Can be used to inject and transfer clipboard between instances.
          //
          const cells = { ...e.pending.cells, A1: { value: 'boo' } };
          // e.modify({ ...e.pending, cells });
        }
      });
  }

  public componentDidMount() {
    const gridEvents$ = this.grid.events$.pipe(takeUntil(this.unmounted$));
    gridEvents$.pipe(debounceTime(10)).subscribe(() => this.updateState());
    this.updateState();
    this.updateRefs();
  }

  public componentWillUnmount() {
    this.unmounted$.next();
  }

  /**
   * [Properties]
   */
  public get grid() {
    return this.testGrid.datagrid.grid;
  }

  private get test$() {
    return this.testGrid.state$;
  }

  /**
   * [Methods]
   */
  public async updateState() {
    const grid = this.grid;
    const { selection, rows, columns, isEditing, clipboard } = grid;
    const { editorType } = this.props;

    const values = R.clone(grid.values);
    Object.keys(values).forEach(key => {
      const hash = values[key] ? (values[key] as any).hash : undefined;
      if (hash) {
        (values[key] as any).hash = `${hash.substring(0, 12)}..(SHA-256)`;
      }
    });

    const data = {
      debug: { editorType },
      grid: value.deleteUndefined({
        isEditing,
        values,
        rows,
        columns,
        selection,
        clipboard,
      }),
    };
    this.state$.next({ data });

    await this.updateRefs();
    return data;
  }

  private updateRefs = async (args: { force?: boolean } = {}) => {
    const { force } = args;
    const table = this.refTable;
    const res = await table.refs({ force });

    const pathToKeys = (path?: string) => (path || '').split('/').filter(part => part);

    const sortKeys = (obj: { [key: string]: any }) => {
      return coord.cell.sort(Object.keys(obj)).reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {});
    };

    // Prepare display versions of data.
    const incoming = Object.keys(res.in)
      .map(key => ({ key, refs: res.in[key] }))
      .reduce((acc, next) => {
        acc[next.key] = next.refs.map((ref: t.IRefIn) => ref.cell).join(',');
        return acc;
      }, {});

    const outgoing = Object.keys(res.out)
      .map(key => ({ key, refs: res.out[key] }))
      .reduce((acc, next) => {
        let err = '';
        const keys = R.pipe(
          R.flatten,
          R.uniq,
        )(
          next.refs.map((ref: t.IRefOut) => {
            const keys = pathToKeys(ref.path);
            err = ref.error ? '(err)' : err;
            return keys;
          }),
        );
        acc[next.key] = `${keys.filter(keys => keys !== next.key).join(',')}${err}`;
        return acc;
      }, {});

    // Update state.
    const refs = {
      data: res,
      display: { in: sortKeys(incoming), out: sortKeys(outgoing) },
    };
    this.state$.next({ refs });
  };

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({
        Flex: 'horizontal',
        flex: 1,
        backgroundColor: color.format(-0.08),
      }),
    };

    return (
      <div {...styles.base}>
        {this.renderLeft()}
        {this.renderMain()}
        {this.renderState()}
      </div>
    );
  }

  private renderLeft() {
    const styles = {
      base: css({
        position: 'relative',
        width: 200,
        padding: 10,
        Scroll: true,
        fontSize: 13,
        lineHeight: 1.6,
      }),
    };
    return (
      <div {...styles.base}>
        {this.button('reset', async () => {
          this.grid.changeCells(DEFAULT.VALUES);
          await this.updateRefs({ force: true });
        })}
        {this.button('updateRefs', () => this.updateRefs())}
        {this.button('updateRefs(force)', () => this.updateRefs({ force: true }))}
        <Hr margin={5} />
        {this.button('redraw', () => this.grid.redraw())}
        {this.button('focus', () => this.grid.focus())}
        {this.button('total row/columns', () => {
          if (typeof this.state.totalColumns === 'number') {
            this.state$.next({ totalColumns: undefined, totalRows: undefined });
          } else {
            this.state$.next({ totalColumns: 5, totalRows: 5 });
          }
        })}
        {this.button('updateHashes', () => {
          this.grid.updateHashes({ force: true });
          this.updateState();
        })}
        <Hr margin={5} />
        {this.button('changeCells', () => this.grid.changeCells({ A1: { value: 'hello' } }))}
        {this.button('changeCells (props)', () =>
          this.grid.changeCells({ A1: { value: 'hello', props: { bold: true } } }),
        )}
        {this.button('changeCells (via prop/state)', () =>
          this.test$.next({ values: { A1: { value: 'happy' } } }),
        )}
        {this.button('changeCells (large)', () => {
          const data = testData({ totalColumns: 52, totalRows: 1000 });
          this.grid.changeCells(data.values);
        })}
        {this.button('mergeCells (A5)', () => {
          this.grid.changeCells({
            A5: { value: 'merged', props: { merge: { colspan: 3, rowspan: 5 } } },
          });
          this.grid.select({ cell: 'A5' });
        })}
        {this.button('props.value (A1)', () => {
          this.grid.changeCells({
            A1: { value: 'A1', props: { value: 'Display Value' } },
          });
        })}

        <Hr margin={5} />
        {this.button('columns (width) - A:200', () =>
          this.test$.next({ columns: { A: { width: 200 } } }),
        )}
        {this.button('columns (width) - A:300', () =>
          this.test$.next({ columns: { A: { width: 300 } } }),
        )}
        {this.button('rows (height) - 1:0', () => this.test$.next({ rows: { 1: { height: 0 } } }))}
        {this.button('rows (height) - 1:120', () =>
          this.test$.next({ rows: { 1: { height: 120 } } }),
        )}
        <Hr margin={5} />
        {this.button('select: A1', () => this.grid.select({ cell: 'A1' }))}
        {this.button('select: A1 and range', () =>
          this.grid.select({ cell: 'A1', ranges: ['B2:C4', 'C2:D7'] }),
        )}
        {this.button('select: bottom/right', () =>
          this.grid.select({
            cell: { row: this.grid.totalRows, column: this.grid.totalColumns },
          }),
        )}
        {this.button('select column: B:B', () => this.grid.select({ cell: 'B1', ranges: ['B:B'] }))}
        {this.button('select row: 3:3', () => this.grid.select({ cell: 'A3', ranges: ['3:3'] }))}
        {this.button('select row and column', () =>
          this.grid.select({ cell: 'B1', ranges: ['3:3', 'B:B'], scrollToCell: false }),
        )}
        <Hr margin={5} />
        {this.button('scrollTo: A1', () => this.grid.scrollTo({ cell: 'A1' }))}
        {this.button('scrollTo: B5', () => this.grid.scrollTo({ cell: 'B5' }))}
        {this.button('scrollTo: bottom/right', () =>
          this.grid.scrollTo({
            cell: { row: this.grid.totalRows, column: this.grid.totalColumns },
          }),
        )}

        {/* <Hr margin={5} />
            {this.button(
              'changeBorders - B2:D4 (red)',
              () => (this.grid.borders = [{ range: 'B2:D4', style: { width: 2, color: 'red' } }]),
            )}
            {this.button(
              'changeBorders - B2:D4 (orange)',
              () =>
                (this.grid.borders = [{ range: 'B2:D4', style: { width: 2, color: 'orange' } }]),
            )}
            {this.button(
              'changeBorders (different edges)',
              () =>
                (this.grid.borders = [
                  {
                    range: 'C8:E12',
                    style: {
                      top: { width: 2, color: 'red' },
                      right: { width: 2, color: 'blue' },
                      bottom: { width: 2, color: 'orange' },
                      left: { width: 2, color: 'green' },
                    },
                  },
                ]),
            )}
            {this.button('changeBorders (clear)', () => (this.grid.borders = []))} */}
      </div>
    );
  }

  private renderMain() {
    const styles = {
      base: css({ position: 'relative', flex: 1 }),
      inner: css({
        Absolute: 10,
        border: `solid 1px ${color.format(-0.2)}`,
      }),
      grid: css({ Absolute: 0 }),
    };
    return (
      <div {...styles.base}>
        <div {...styles.inner}>
          <TestGridView
            ref={this.testGridRef}
            style={styles.grid}
            editorType={this.props.editorType}
            events$={this.events$}
            totalColumns={this.state.totalColumns}
            totalRows={this.state.totalRows}
          />
        </div>
      </div>
    );
  }

  private renderState() {
    const data = this.state.data;
    if (!data) {
      return null;
    }
    const styles = {
      base: css({
        backgroundColor: COLORS.DARK,
        width: 300,
        padding: 8,
        paddingLeft: 12,
        Scroll: true,
        borderBottom: `solid 1px ${color.format(0.1)}`,
      }),
    };

    const refs = this.state.refs || {};
    const refsDisplay = refs.display || {};
    const hr = <Hr color={1} margin={12} />;

    return (
      <div {...styles.base}>
        <ObjectView
          name={'ui.datagrid'}
          data={data.grid}
          expandPaths={[
            '$',
            '$',
            '$.selection',
            '$.selection.ranges',
            // '$.values',
            // '$.values.A1',
            '$.clipboard',
          ]}
          theme={'DARK'}
        />
        {hr}
        <ObjectView name={'refs'} data={refs.data} expandLevel={1} theme={'DARK'} />
        {hr}
        <ObjectView name={'refs.in'} data={refsDisplay.in} expandLevel={5} theme={'DARK'} />
        {hr}
        <ObjectView name={'refs.out'} data={refsDisplay.out} expandLevel={5} theme={'DARK'} />
        {hr}
        <ObjectView name={'debug'} data={data.debug} expandPaths={['$']} theme={'DARK'} />
      </div>
    );
  }

  /**
   * [Handlers]
   */
  private button = (label: string, handler: () => void) => {
    return <Button label={label} onClick={handler} block={true} />;
  };
}
