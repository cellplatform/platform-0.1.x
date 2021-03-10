import { PeerJS, cuid } from '../../common';
import * as t from './types';

/**
 * Common way of creating a Peer that ensure it the creation event
 * is fired through an event bus.
 */
export function createPeer(args: { bus: t.EventBus<any>; id?: string }) {
  const id = args.id === undefined ? cuid() : args.id;
  const bus = args.bus.type<t.ConversationEvent>();
  const peer = new PeerJS(id);
  bus.fire({ type: 'Conversation/created', payload: { peer } });
  return peer;
}