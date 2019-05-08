import { Observable } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';

import { gql, R, t, graphql } from '../common';

/**
 * Manage conversation-thread interactions.
 */
export class ConversationThreadGraphql {
  /**
   * [Lifecycle]
   */
  public constructor(args: {
    client: t.IGqlClient;
    store: t.IThreadStore;
    dispose$: Observable<{}>;
  }) {
    const { client, store, dispose$ } = args;
    const changed$ = store.changed$.pipe(takeUntil(dispose$));

    this.store = store;
    this.client = client;
    this.dispose$ = dispose$;

    let prev = store.state;
    changed$
      .pipe(
        debounceTime(300),
        filter(() => !R.equals(prev.items, store.state.items)),
      )
      .subscribe(e => {
        this.saveThread(this.store.state);
        prev = store.state;
      });
  }

  /**
   * [Fields]
   */
  public readonly client: t.IGqlClient;
  public readonly store: t.IThreadStore;
  public readonly dispose$: Observable<{}>;

  /**
   * [Methods]
   */
  public async saveThread(input: t.IThreadModel | t.IThreadStoreModel) {
    const mutation = gql`
      mutation SaveThread($thread: JSON) {
        conversation {
          threads {
            save(thread: $thread)
          }
        }
      }
    `;

    // Remove any UI specific parts of the model.
    input = { ...input };
    delete (input as t.IThreadStoreModel).draft;

    // Send to server.
    type IVariables = { thread: t.IThreadModel };
    const variables: IVariables = { thread: input };
    const res = await this.client.mutate<boolean, IVariables>({ mutation, variables });

    // Finish up.
    return res;
  }

  /**
   * Looks up a thread by the given ID.
   */
  public async findById(id: string) {
    const query = gql`
      query Thread($id: ID!) {
        conversation {
          thread(id: $id) {
            id
            items
            users {
              id
              name
              email
            }
          }
        }
      }
    `;

    type TData = { conversation: { thread: t.IThreadModel } };

    const variables = { id };
    const res = await this.client.query<TData>({
      query,
      variables,
      fetchPolicy: 'network-only',
    });

    const thread = res.data.conversation ? res.data.conversation.thread : undefined;
    return graphql.clean(thread);
  }
}
