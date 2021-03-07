import { Subject } from 'rxjs';
import { filter, takeUntil, map } from 'rxjs/operators';

import { PeerJS, R, rx, t, getQuery } from './common';

/**
 * Manages state changes.
 */
export function stateController(args: { bus: t.EventBus<any>; model: t.ConversationModel }) {
  const { model } = args;
  let peer: PeerJS;
  const connections: PeerJS.DataConnection[] = [];

  const bus = args.bus.type<t.ConversationEvent>();
  const dispose = () => dispose$.next();
  const dispose$ = new Subject<void>();
  const $ = bus.event$.pipe(takeUntil(dispose$));
  const publish$ = rx
    .payload<t.ConversationPublishEvent>($, 'Conversation/publish')
    .pipe(filter((e) => Boolean(peer)));

  const changeModel = (data: Partial<t.ConversationState>) => {
    bus.fire({
      type: 'Conversation/model/change',
      payload: { data },
    });
    updateUrl();
  };

  /**
   * Listen for incoming data.
   */
  const listen = (connection: PeerJS.DataConnection) => {
    connection.on('data', (input) => {
      if (typeof input !== 'object') return;
      if (typeof input.kind !== 'string') return;

      const payload = input as t.ConversationPublish;
      if (payload.kind === 'model') changeModel(payload.data);
      if (payload.kind === 'file') {
        bus.fire({ type: 'Conversation/file', payload: { data: payload.data } });
      }
    });
  };

  /**
   * Broadcast a payload to all connected peers.
   */
  const publish = (payload: t.ConversationPublish) => {
    connections.forEach((conn) => conn.send(payload));
  };

  const updateUrl = () => {
    const self = peer.id;
    const modelPeers = Object.keys(model.state.peers).sort();
    const urlPeers = R.uniq([peer.id, ...modelPeers.filter((id) => id !== self)]);
    const querystring = `?connectTo=${urlPeers.join(',')}`;
    if (location.search !== querystring) {
      history.replaceState(null, 'Meeting Peers', querystring);
    }
  };

  /**
   * Init
   */
  rx.payload<t.ConversationCreatedEvent>($, 'Conversation/created')
    .pipe()
    .subscribe((e) => {
      peer = e.peer;
      peer.on('connection', (conn) => {
        listen(conn);
        // updateUrl();
      });
    });

  /**
   * Peer connected. Setup outgoing connection.
   */
  rx.payload<t.ConversationConnectEvent>($, 'Conversation/connect')
    .pipe(filter((e) => Boolean(peer)))
    .subscribe((e) => {
      const conn = peer.connect(e.id);
      conn.on('open', () => {
        connections.push(conn);
        bus.fire({
          type: 'Conversation/publish',
          payload: {
            kind: 'model',
            data: model.state,
          }, // NB: Ensure the peer's meta-data is published.
        });

        updateUrl();
      });
    });

  /**
   * Listen: [Model] publish request.
   */
  publish$
    .pipe(
      filter((e) => e.kind === 'model'),
      map((e) => e as t.ConversationPublishModel),
    )
    .subscribe((e) => {
      const id = peer.id;
      const peers: t.ConversationStatePeers = {
        [id]: { id, userAgent: navigator.userAgent, isSelf: true, resolution: {} },
      };
      const data = R.mergeDeepRight(e.data, { peers }) as t.ConversationState;
      changeModel(data);
      publish({ ...e, data });
    });

  /**
   * Listen: [File] publish request.
   */
  publish$
    .pipe(
      filter((e) => e.kind === 'file'),
      map((e) => e as t.ConversationPublishFile),
    )
    .subscribe((e) => {
      publish(e);
    });

  /**
   * Update model with new state.
   */
  rx.payload<t.ConversationModelChangeEvent>($, 'Conversation/model/change')
    .pipe(filter((e) => Boolean(peer)))
    .subscribe((e) => {
      const state = R.mergeDeepRight(model.state, e.data) as t.ConversationState;

      Object.keys(state.peers)
        .filter((id) => id !== peer.id)
        .forEach((id) => delete state.peers[id].isSelf); // NB: Clean up other peer data.

      if (!R.equals(state, model.state)) {
        model.change(state);
      }
    });

  return {
    dispose$: dispose$.asObservable(),
    dispose,
  };
}
