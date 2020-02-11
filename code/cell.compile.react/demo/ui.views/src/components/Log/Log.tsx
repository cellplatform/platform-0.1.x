import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { color, css, CssValue, t } from '../../common';
import { LogExpanded } from './LogExpanded';
import { LogList } from './LogList';
import { Button, Icons } from '../primitives';
import { LogCollapsed } from './LogCollapsed';

export type ILogProps = {
  isExpanded?: boolean;
  items?: t.ILogItem[];
  style?: CssValue;
  onExpandClick?: (e: {}) => void;
  onCollapseClick?: (e: {}) => void;
};
export type ILogState = {};

export class Log extends React.PureComponent<ILogProps, ILogState> {
  public state: ILogState = {};
  private state$ = new Subject<Partial<ILogState>>();
  private unmounted$ = new Subject<{}>();

  /**
   * [Lifecycle]
   */
  public componentDidMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));
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
        Absolute: [0, 0, 0, null],
        width: 300,
      }),
    };

    const { isExpanded } = this.props;

    return (
      <div {...css(styles.base, this.props.style)}>
        {this.renderCollapsed()}
        {this.renderExpanded()}
      </div>
    );
  }

  private renderCollapsed() {
    const { items = [], isExpanded } = this.props;
    if (isExpanded) {
      return null;
    }
    return <LogCollapsed items={items} onExpandClick={this.props.onExpandClick} />;
  }

  private renderExpanded() {
    const { items = [], isExpanded } = this.props;
    const count = items.length;
    if (!isExpanded) {
      return null;
    }
    const elList = count > 0 && <LogList items={items} />;
    return <LogExpanded children={elList} onCloseClick={this.props.onCollapseClick} />;
  }
}
