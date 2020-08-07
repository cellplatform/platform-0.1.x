import { color, css, CssValue } from '@platform/css';
import { Button } from '@platform/ui.button';
import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TreeView } from '../..';
import { t } from '../../common';
import { TreeViewState } from '../../components.dev/TreeViewState';

type Node = t.ITreeviewNode;
const header: t.ITreeviewNodeHeader = { isVisible: false, marginBottom: 45 };

const SAMPLES = {
  DEFAULT: {
    id: 'root',
    props: { treeview: { label: 'Root', header } },
    children: [
      {
        id: 'Default-1',
        children: [{ id: 'Child-2.1' }, { id: 'Child-2.2' }, { id: 'Child-2.3' }],
      },
    ],
  } as Node,
  TWISTY: {
    id: 'root',
    props: { treeview: { label: 'Root', header } },
    children: [
      {
        id: 'Default-1',
        props: { treeview: { inline: {} } },
        children: [{ id: 'Child-2.1' }, { id: 'Child-2.2' }, { id: 'Child-2.3' }],
      },
    ],
  } as Node,
};

Object.keys(SAMPLES).forEach((key) => {
  const node = SAMPLES[key];
  TreeView.query(node).walkDown((e) => {
    TreeView.util.props(e.node, (props) => {
      props.label = props.label || e.id;
    });
  });
});

export type ITestProps = { style?: CssValue };

export class Test extends React.PureComponent<ITestProps> {
  private unmounted$ = new Subject();
  private treeview$ = new Subject<t.TreeviewEvent>();

  private tree = TreeView.State.create({ root: SAMPLES.DEFAULT, dispose$: this.unmounted$ });

  private nav = TreeView.Navigation.create({
    tree: this.tree,
    treeview$: this.treeview$,
    dispose$: this.unmounted$,
    strategy: TreeView.Navigation.strategies.default,
  });

  /**
   * [Lifecycle]
   */
  public componentDidMount() {
    const redraw$ = this.nav.redraw$.pipe(takeUntil(this.unmounted$));
    redraw$.subscribe((e) => this.forceUpdate());
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
        Absolute: 0,
        Flex: 'horizontal-stretch-stretch',
        backgroundColor: color.format(0.5),
      }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        {this.renderTree('left')}
        {this.renderCenter()}
        {this.renderTree('right')}
      </div>
    );
  }

  private renderTree(edge: 'left' | 'right') {
    const styles = {
      base: css({
        width: 280,
        display: 'flex',
        borderLeft: edge === 'right' && `solid 1px ${color.format(-0.1)}`,
        borderRight: edge === 'left' && `solid 1px ${color.format(-0.1)}`,
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

  private renderCenter() {
    const styles = {
      base: css({
        flex: 1,
        position: 'relative',
        boxSizing: 'border-box',
        backgroundColor: color.format(1),
        Flex: 'vertical-stretch-stretch',
      }),
      body: css({ position: 'relative', flex: 1 }),
      scroll: css({
        Absolute: 0,
        padding: 30,
        paddingTop: 80,
        PaddingX: 50,
        Scroll: true,
        paddingBottom: 100,
        Flex: 'start-spaceBetween',
      }),
      state: css({ flex: 1, maxWidth: 680 }),
    };

    return (
      <div {...styles.base}>
        {this.renderToolbar()}
        <div {...styles.body}>
          <div {...styles.scroll}>
            <div />
            <TreeViewState
              store={this.tree}
              current={this.nav.current}
              selected={this.nav.selected}
              style={styles.state}
            />
            <div />
          </div>
        </div>
      </div>
    );
  }

  private renderToolbar() {
    const styles = {
      base: css({
        position: 'relative',
        height: 34,
        borderBottom: `solid 1px ${color.format(-0.1)}`,
        Flex: 'horizontal-center-start',
        fontSize: 14,
        PaddingX: 15,
        color: color.format(-0.3),
      }),
      spacer: css({ MarginX: 6 }),
      div: css({
        MarginX: 15,
        borderLeft: `solid 1px ${color.format(-0.1)}`,
        height: '70%',
      }),
    };

    const spacer = <div {...styles.spacer} />;
    const div = <div {...styles.div} />;

    return (
      <div {...styles.base}>
        <Button onClick={this.onRedrawClick}>Redraw</Button>
        {div}
        <div>Load:</div>
        {spacer}
        <Button onClick={this.loadHandler(SAMPLES.DEFAULT)}>Default</Button>
        {spacer}
        <Button onClick={this.loadHandler(SAMPLES.TWISTY)}>Twisty</Button>
        {div}
        <Button onClick={this.tree.clear}>Clear</Button>
      </div>
    );
  }

  /**
   * [Handlers]
   */
  private onRedrawClick = () => this.forceUpdate();

  private loadHandler = (root: Node) => {
    return () => {
      // this.tree.clear();
      // this.tree.add({ root });
      this.tree.change((draft) => (draft.children = root.children));
    };
  };
}
