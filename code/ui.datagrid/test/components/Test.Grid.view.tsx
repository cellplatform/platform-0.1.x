import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

import {
  CellEditor,
  css,
  datagrid,
  GlamorValue,
  Handsontable as HandsontableLib,
  markdown,
  color,
  t,
} from '../common';
import { DebugEditor } from './Debug.Editor';

export type DataGrid = datagrid.DataGrid;

export type ITestGridViewProps = {
  grid: datagrid.Grid;
  fullScreenCell?: string;
  events$?: Subject<t.GridEvent>;
  editorType: t.TestEditorType;
  style?: GlamorValue;
  Table?: Handsontable;
};
export type ITestGridViewState = {};

export class TestGridView extends React.PureComponent<ITestGridViewProps, ITestGridViewState> {
  public state: ITestGridViewState = {};
  private state$ = new Subject<Partial<ITestGridViewState>>();
  private unmounted$ = new Subject<{}>();
  private events$ = this.props.events$ || new Subject<t.GridEvent>();

  /**
   * [Lifecycle]
   */
  public componentWillMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));
  }

  public componentDidMount() {
    const events$ = this.events$.pipe(takeUntil(this.unmounted$));
    const keyboard$ = this.props.grid.keyboard$;

    events$.pipe(filter(e => !['GRID/keydown'].includes(e.type))).subscribe(e => {
      // console.log('🌳 EVENT', e.type, e.payload);
    });

    // keyboard$
    //   .pipe(
    //     filter(e => e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey),
    //     filter(e => e.key.toUpperCase() === 'B'),
    //   )
    //   .subscribe(e => {
    //     console.log('e', e);
    //     // this.grid.changeCells({ A1: { value: 'hello', props: { bold: true } } });
    //     const selection = this.grid.selection;
    //     console.log('selection', selection);
    //     if (selection && selection.cell) {
    //       const cell = this.grid.cell(selection.cell);
    //       const value = cell.value;
    //       const props = (cell.props || {}) as any;
    //       const bold = props.bold ? false : true;
    //       const change = { [cell.key]: { value, props: { ...props, bold } } };
    //       console.log('change', change);
    //       this.grid.changeCells(change);
    //       // cell.props = {...cell.props}
    //     }
    //   });

    events$
      .pipe(
        filter(e => e.type === 'GRID/EDITOR/end'),
        map(e => e.payload as t.IEndEditing),
        filter(e => !e.isCancelled),
      )
      .subscribe(e => {
        // e.payload.cancel();
      });

    const beginEdit$ = events$.pipe(
      filter(e => e.type === 'GRID/EDITOR/begin'),
      map(e => e.payload as t.IBeginEditing),
    );

    beginEdit$.pipe(filter(e => e.cell.key === 'B1')).subscribe(e => {
      // Cancel B1 edit operations before they begin.
      e.cancel();
    });

    const change$ = events$.pipe(
      filter(e => e.type === 'GRID/cells/change'),
      map(e => e.payload as t.IGridCellsChange),
    );

    const selection$ = events$.pipe(
      filter(e => e.type === 'GRID/selection'),
      map(e => e.payload as t.IGridSelectionChange),
    );

    change$.subscribe(e => {
      // e.cancel();
      // console.log('CHANGE', e);
    });

    change$.pipe().subscribe(e => {
      const B2 = e.changes.find(change => change.cell.key === 'B2');
      if (B2) {
        B2.cancel();
      }
    });
  }

  public componentWillUnmount() {
    this.unmounted$.next();
  }

  /**
   * [Properties]
   */
  private get Table() {
    const { Table = HandsontableLib } = this.props;
    return Table as Handsontable;
  }

  /**
   * [Render]
   */
  public render() {
    return (
      <datagrid.DataGrid
        grid={this.props.grid}
        factory={this.factory}
        fullScreenCell={this.props.fullScreenCell}
        Handsontable={this.Table}
        events$={this.events$}
        initial={{ selection: 'A1' }}
        style={this.props.style}
        canSelectAll={false}
      />
    );
  }

  private factory: t.GridFactory = req => {
    const cell = req.cell;
    const view = cell.props.view;
    if (req.type === 'EDITOR') {
      return this.renderEditor(req);
    }

    if (req.type === 'CELL') {
      if (!view.cell || !view.cell.type) {
        // Default view.
        return formatValue(req.cell.data);
      } else {
        const styles = {
          base: css({
            Absolute: 0,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            fontSize: 11,
            Flex: 'center-center',
          }),
        };
        return <div {...styles.base}>CUSTOM: {view.cell.type}</div>;
      }
    }

    if (req.type === 'SCREEN' && view.screen) {
      const type = view.screen.type;
      const styles = {
        base: css({
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          flex: 1,
        }),
        inner: css({
          Absolute: 40,
          border: `solid 1px ${color.format(-0.2)}`,
          Flex: 'center-center',
          backgroundColor: color.format(1),
          boxShadow: `0 0 8px 0 ${color.format(-0.1)}`,
        }),
      };
      return (
        <div {...styles.base}>
          <div {...styles.inner}>
            <div>
              {type}: {cell.key}
            </div>
          </div>
        </div>
      );
    }

    console.log(`Factory type '${req.type}' not supported by test.`);
    return null;
  };

  private renderEditor = (req: datagrid.IGridFactoryRequest) => {
    switch (this.props.editorType) {
      case 'default':
        return <CellEditor />;

      default:
        return <DebugEditor />;
    }
  };
}

/**
 * [Helpers]
 */
function formatValue(cell: t.IGridCellData) {
  let value = cell.props && cell.props.value ? cell.props.value : cell.value;
  value = typeof value === 'string' && !value.startsWith('=') ? markdown.toHtmlSync(value) : value;
  value = typeof value === 'object' ? JSON.stringify(value) : value;
  return value;
}
