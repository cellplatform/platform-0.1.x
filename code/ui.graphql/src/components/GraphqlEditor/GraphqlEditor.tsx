import '../../styles';

import * as React from 'react';
import { Subject } from 'rxjs';
import { share, takeUntil } from 'rxjs/operators';

import { constants, css, GlamorValue, graphqlFetcher } from '../../common';
import { GraphqlEditorEvent } from './types';

const GraphiQL = require('graphiql');

export type IGraphqlEditorProps = { style?: GlamorValue; events$?: Subject<GraphqlEditorEvent> };
export type IGraphqlEditorState = {};

export class GraphqlEditor extends React.PureComponent<IGraphqlEditorProps, IGraphqlEditorState> {
  public state: IGraphqlEditorState = {};
  private unmounted$ = new Subject();
  private state$ = new Subject<Partial<IGraphqlEditorState>>();

  private _events$ = new Subject<GraphqlEditorEvent>();
  public events$ = this._events$.pipe(
    takeUntil(this.unmounted$),
    share(),
  );

  private graphiql!: any;
  private graphiqlRef = (ref: any) => (this.graphiql = ref);

  /**
   * [Lifecycle]
   */
  public componentWillMount() {
    const { events$ } = this.props;
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));
    if (events$) {
      this.events$.subscribe(e => events$.next(e));
    }
  }

  public componentWillUnmount() {
    this.unmounted$.next();
  }

  /**
   * [Properties]
   */
  public get query() {
    return this.editor.query.getValue();
  }

  public set query(text: string) {
    this.editor.query.setValue(text);
  }

  public get variables() {
    return this.editor.variable.getValue();
  }

  public set variables(text: string) {
    this.editor.variable.setValue(text);
  }

  public get editor() {
    const graphiql = this.graphiql;
    return {
      get query() {
        return graphiql.getQueryEditor() as CodeMirror.Editor;
      },
      get variable() {
        return graphiql.getVariableEditor() as CodeMirror.Editor;
      },
    };
  }

  /**
   * [Methods]
   */
  public prettify() {
    const { parse, print } = require('graphql');
    this.query = print(parse(this.query));
    this.fire({
      type: 'GRAPHQL_EDITOR/prettified',
      payload: { query: this.query, variables: this.variables },
    });
  }

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({
        position: 'relative',
        flex: 1,
      }),
      logo: css({ display: 'none' }),
    };
    return (
      <div {...css(styles.base, this.props.style)} className={constants.CSS.ROOT}>
        <GraphiQL
          ref={this.graphiqlRef}
          fetcher={graphqlFetcher}
          editorTheme={'nord'}
          onEditQuery={this.handleEditQuery}
          onEditVariables={this.handleEditVariables}
          onEditOperationName={this.handleEditOperationName}
          onToggleDocs={this.handleToggleDocs}
        >
          <GraphiQL.Logo>
            <div {...styles.logo} />
          </GraphiQL.Logo>
          <GraphiQL.Toolbar>
            <GraphiQL.Button
              label={'Pretty'}
              title={'Prettify Query (Shift-Ctrl-P)'}
              onClick={this.handlePrettify}
            />
          </GraphiQL.Toolbar>
        </GraphiQL>
      </div>
    );
  }

  /**
   * [Handlers]
   */
  private fire = (e: GraphqlEditorEvent) => this._events$.next(e);

  private handlePrettify = () => this.prettify();

  private handleEditQuery = (query: string) => {
    this.fire({
      type: 'GRAPHQL_EDITOR/changed/query',
      payload: { query, variables: this.variables },
    });
  };

  private handleEditVariables = (variables: string) => {
    this.fire({
      type: 'GRAPHQL_EDITOR/changed/variables',
      payload: { variables, query: this.query },
    });
  };

  private handleEditOperationName = (name: string) => {
    this.fire({
      type: 'GRAPHQL_EDITOR/changed/operationName',
      payload: {
        name,
        query: this.query,
        variables: this.variables,
      },
    });
  };

  private handleToggleDocs = (isVisible: boolean) => {
    this.fire({ type: 'GRAPHQL_EDITOR/docs/toggled', payload: { isVisible } });
  };
}
