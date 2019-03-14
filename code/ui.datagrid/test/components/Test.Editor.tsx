import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { css, datagrid } from './common';

export type ITestEditorProps = {};
export type ITestEditorState = {};

export class TestEditor extends React.PureComponent<ITestEditorProps, ITestEditorState> {
  public state: ITestEditorState = {};
  private unmounted$ = new Subject();
  private state$ = new Subject<Partial<ITestEditorState>>();

  public static contextType = datagrid.EditorContext;
  public context!: datagrid.ReactEditorContext;

  /**
   * [Lifecycle]
   */
  public componentWillMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));
  }

  public componentDidMount() {
    console.log('--------------------editor mounted');
    console.log('this.context', this.context);
  }

  public componentWillUnmount() {
    this.unmounted$.next();
  }

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({
        backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      }),
    };
    return (
      <div {...styles.base}>
        <input defaultValue={'foobar'} />
      </div>
    );
  }
}
