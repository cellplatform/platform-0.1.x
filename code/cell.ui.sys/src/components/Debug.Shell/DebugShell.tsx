import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { color, css, CssValue, t } from '../../common';
import { TreeView } from '../primitives';

export type IDebugShellProps = { style?: CssValue };
export type IDebugShellState = t.Object;

export class DebugShell extends React.PureComponent<IDebugShellProps, IDebugShellState> {
  public state: IDebugShellState = {};
  private state$ = new Subject<Partial<IDebugShellState>>();
  private unmounted$ = new Subject();
  private treeview$ = new Subject<t.TreeViewEvent>();

  private nav = TreeView.Navigation.create({
    // tree: this.tree,
    treeview$: this.treeview$,
    dispose$: this.unmounted$,
    strategy: TreeView.Navigation.strategies.default,
  });

  /**
   * [Lifecycle]
   */

  public componentDidMount() {
    const unmounted$ = this.unmounted$;
    this.state$.pipe(takeUntil(unmounted$)).subscribe((e) => this.setState(e));
    this.nav.redraw$.pipe(takeUntil(unmounted$)).subscribe((e) => this.forceUpdate());

    // TEMP 🐷
    // this.nav.

    // this.nav.
    this.nav.tree.add({ root: 'foo' });
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({
        backgroundColor: color.format(1),
        Absolute: 0,
        Flex: 'horizontal-stretch-stretch',
      }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        {this.renderTree()}
        {this.renderBody}
      </div>
    );
  }

  private renderTree() {
    const styles = {
      base: css({
        display: 'flex',
        width: 280,
        borderRight: `solid 1px ${color.format(-0.1)}`,
        WebkitAppRegion: 'drag',
      }),
    };
    return (
      <div {...styles.base}>
        <TreeView
          root={this.nav.root}
          current={this.nav.current}
          event$={this.treeview$}
          background={'NONE'}
          tabIndex={0}
        />
      </div>
    );
  }

  private renderBody() {
    const styles = {
      base: css({}),
    };
    return (
      <div {...styles.base}>
        <div>Body</div>
      </div>
    );
  }
}
