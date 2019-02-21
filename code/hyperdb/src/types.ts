export * from './db/types';
export * from './swarm/types';

/**
 * [Database]
 */

export type IDbValueMeta<K> = {
  key: K;
  exists: boolean;
  deleted: boolean;
  clock: number[];
  feed: number;
  seq: number;
  path: number[];
  inflate: number;
  trie: any;
};

export type IDbValue<K, V> = {
  value: V | undefined;
  meta: IDbValueMeta<K>;
};

/**
 * [Swarm]
 */

type Bitfield = any;
type TreeIndex = { [key: string]: Bitfield };

/**
 * Local writable feed.
 * You have to get an owner of the hyperdb to authorize you to have your writes replicate.
 * The first person to create the hyperdb is the first owner.
 */
export type IFeed = {
  id: Buffer;
  key: Buffer;
  bitfield: Bitfield;
  discoveryKey: Buffer;
  secretKey: Buffer;
  peers: IPeer[];
  tree: TreeIndex;
  length: number;
  maxRequests: number;
  byteLength: number;
  remoteLength: number;
  allowPush: boolean;
  live: boolean;
  opened: boolean;
  readable: boolean;
  sparse: boolean;
  writable: boolean;
  closed: false;
};

export type ISwarmOptions = {
  id: string;
  stream: (peer: IPeer) => IProtocol;
  utp: boolean;
  tcp: boolean;
  maxConnections: number;
  whitelist: string[];
};

export type IPeer = {
  channel: Buffer;
  host: string;
  id: Buffer;
  initiator: boolean;
  port: number;
  type: 'tcp';
};

export type IProtocol = {
  id: Buffer;
  key: Buffer;
  ack: boolean;
  allowHalfOpen: boolean;
  discoveryKey: Buffer;
  expectedFeeds: number;
  feeds: IFeed[];
  userData: any;
  maxFeeds: number;
  live: boolean;
  readable: boolean;
  writable: boolean;
  encrypted: boolean;
  extension: any[];
  destroyed: boolean;

  remoteId: Buffer;
  remoteAck: boolean;
  remoteDiscoveryKey: Buffer;
  removeLive: boolean;
  remoteUserData: any;
  remoteExtensions: any[];
};
