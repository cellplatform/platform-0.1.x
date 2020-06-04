import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { color, css, CssValue, t, parseError } from '../../common';

const PINK = '#FE0168';

export type IErrorViewProps = {
  error: t.IErrorInfo;
  component?: t.IErrorComponent;
  style?: CssValue;
};
export type IErrorViewState = {};

export class ErrorView extends React.Component<IErrorViewProps, IErrorViewState> {
  public static parse = parseError;

  public state: IErrorViewState = {};
  private state$ = new Subject<Partial<IErrorViewState>>();
  private unmounted$ = new Subject<{}>();

  /**
   * [Lifecycle]
   */

  public componentDidMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe((e) => this.setState(e));
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
        backgroundColor: color.alpha(PINK, 0.9),
        color: color.format(1),
        Flex: 'center-center',
        paddingBottom: '10%',
      }),
    };
    return <div {...css(styles.base, this.props.style)}>{this.renderBody()}</div>;
  }

  private renderBody() {
    const { error } = this.props;
    const styles = {
      base: css({
        margin: 40,
        minWidth: 350,
      }),
      title: css({
        borderBottom: `solid 2px ${color.format(1)}`,
        paddingBottom: 10,
        marginBottom: 10,
      }),
    };

    return (
      <div {...styles.base}>
        <div {...styles.title}>Error: {error.message}</div>
        {this.renderComponentStack()}
        {this.renderErrorStack()}
      </div>
    );
  }

  private renderErrorStack() {
    const { error } = this.props;
    const styles = {
      base: css({}),
      stack: css({
        fontFamily: 'monospace',
        lineHeight: '1.3em',
        fontSize: 12,
      }),
      stackLine: css({
        Flex: 'horizontal-center-spaceBetween',
      }),
      stackPosition: css({
        opacity: 0.5,
        marginLeft: 15,
      }),
    };

    const elStack = error.stack.map((stack, i) => {
      return (
        <div key={i} {...styles.stackLine}>
          <div>{stack.text}</div>
          <div {...styles.stackPosition}>
            {stack.line}:{stack.char}
          </div>
        </div>
      );
    });

    return (
      <div {...styles.base}>
        <div {...styles.stack}>{elStack}</div>
      </div>
    );
  }

  private renderComponentStack() {
    const { component } = this.props;
    if (!component) {
      return null;
    }

    const styles = {
      base: css({
        position: 'relative',
        borderBottom: `solid 2px ${color.format(1)}`,
        paddingBottom: 10,
        marginBottom: 10,
        boxSizing: 'border-box',

        fontFamily: 'monospace',
        lineHeight: '1.3em',
        fontSize: 12,
      }),
      timeline: css({
        Absolute: [16, null, 26, 18],
        width: 1,
        backgroundColor: color.format(0.3),
      }),
      label: css({ Flex: 'horizontal-center-start' }),
      indent: css({ marginLeft: 30 }),
      createdBy: css({
        marginLeft: 10,
        opacity: 0.5,
      }),
    };

    const stack = component.stack;
    const elStack = stack.map((item, i) => {
      const isFirst = i === 0;
      const isLast = i === stack.length - 1;
      const isEdge = isFirst || isLast;
      const labelStyle = !isEdge && styles.indent;
      const label = isEdge ? item.lineIn : item.lineIn || item.createdBy;
      const createdBy = !(isEdge && label === item.createdBy) && item.createdBy;
      return (
        <div key={i}>
          <div {...css(styles.label, labelStyle)}>
            <div>{isEdge ? `<${label}>` : label}</div>
            {createdBy && <div {...styles.createdBy}>created by: {createdBy}</div>}
          </div>
        </div>
      );
    });

    return (
      <div {...styles.base}>
        {stack.length > 2 && <div {...styles.timeline} />}
        {elStack}
      </div>
    );
  }
}
