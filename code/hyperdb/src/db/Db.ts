import { Subject } from 'rxjs';
import { share, takeUntil, filter, map } from 'rxjs/operators';

import { value as valueUtil } from '../common';
import * as t from './types';

const hyperdb = require('hyperdb');
type WatcherRefs = { [key: string]: WatcherRef };
type WatcherRef = { destroy: () => void };

/**
 * Promise based wrapper around a HyperDB instance.
 *
 * See:
 *  - https://github.com/mafintosh/hyperdb#api
 *
 */
export class Db<D extends object = any> implements t.IDb<D> {
  /**
   * [Static]
   */
  public static create<D extends object = any>(args: { storage: string; dbKey?: string }) {
    const reduce = (a: any, b: any) => a;
    return new Promise<Db<D>>((resolve, reject) => {
      const { storage, dbKey } = args;
      const options = { valueEncoding: 'utf-8', reduce };
      const db = args.dbKey ? hyperdb(storage, dbKey, options) : hyperdb(storage, options);
      db.on('ready', () => {
        resolve(new Db<D>(db));
      });
    });
  }

  /**
   * [Constructor]
   */
  private constructor(hyperdb: any) {
    this._.db = hyperdb;
  }

  /**
   * [Fields]
   */
  private _ = {
    db: null as any,
    dispose$: new Subject(),
    events$: new Subject<t.DbEvent>(),
    watchers: ({} as unknown) as WatcherRefs,
  };
  public readonly dispose$ = this._.dispose$.pipe(share());
  public readonly events$ = this._.events$.pipe(
    takeUntil(this.dispose$),
    share(),
  );
  public readonly watch$ = this.events$.pipe(
    filter(e => e.type === 'DB/watch'),
    map(e => e.payload as t.IDbWatchChange),
    share(),
  );

  /**
   * Disposes of the object and stops all related observables.
   */
  public dispose() {
    this.unwatch();
    this.isDisposed = true;
    this._.dispose$.next();
  }
  public isDisposed = false;

  /**
   * [Properties]
   */
  public get key(): string {
    return this.buffer.key.toString('hex');
  }

  public get discoveryKey(): string {
    return this.buffer.discoveryKey.toString('hex');
  }

  public get localKey(): string {
    return this.buffer.localKey.toString('hex');
  }

  public get buffer() {
    const db = this._.db;
    const local = this._.db.local as t.IFeed;
    return {
      key: db.key as Buffer,
      discoveryKey: db.discoveryKey as Buffer,
      localKey: local.key as Buffer,
    };
  }

  public get watching() {
    return Object.keys(this._.watchers);
  }

  /**
   * [Methods]
   */
  public replicate(options: { live?: boolean }) {
    this.throwIfDisposed('replicate');
    const { live = false } = options;

    // NOTE: Tack userData onto the replicated database.
    //    This is used by the swarm-connection event to filter on peers
    //    that are looking for this database.
    //
    // See:
    //    Swarm connection event listener.
    //
    // See:
    //    https://github.com/karissa/hyperdiscovery/pull/12#pullrequestreview-95597621
    //    https://github.com/cblgh/hyperdb-examples
    //
    const userData = this.buffer.localKey;

    return this._.db.replicate({ live, userData });
  }

  /**
   * Checks whether a key is authorized to write to the database.
   */
  public isAuthorized(peerKey?: Buffer) {
    return new Promise<boolean>((resolve, reject) => {
      if (!(peerKey instanceof Buffer)) {
        resolve(false);
      }
      this._.db.authorized(peerKey, (err: Error, result: boolean) => {
        return err ? this.fireError(err, reject) : resolve(result);
      });
    });
  }

  /**
   * Authorizes a peer to write to the database.
   */
  public async authorize(peerKey: Buffer) {
    this.throwIfDisposed('authorize');
    return new Promise((resolve, reject) => {
      this._.db.authorize(peerKey, (err: Error) => {
        return err ? this.fireError(err, reject) : resolve();
      });
    });
  }

  /**
   * Get the current version identifier as a buffer for the db.
   */
  public version() {
    return new Promise<string>((resolve, reject) => {
      this._.db.version((err: Error, result: any) => {
        return err ? this.fireError(err, reject) : resolve(result.toString('hex'));
      });
    });
  }

  /**
   * Checkout the database at an older version.
   * The response is a new [Db] instance.
   *
   * NOTE:
   *      Version should be a version identifier returned
   *      by the `db.version` method.
   */
  public checkout(version: string | Buffer) {
    return new Db<D>(this._.db.checkout(version));
  }

  /**
   * Gets a value from the database.
   */
  public async get<K extends keyof D>(key: K) {
    this.throwIfDisposed('get');
    return new Promise<t.IDbValue<K, D[K]>>((resolve, reject) => {
      this._.db.get(key, (err: Error, result: any) => {
        return err ? this.fireError(err, reject) : resolve(toValue(result));
      });
    });
  }

  /**
   * Writes a value to the database.
   */
  public async put<K extends keyof D>(key: K, value: D[K]) {
    this.throwIfDisposed('put');
    return new Promise<t.IDbValue<K, D[K]>>((resolve, reject) => {
      this._.db.put(key, value, (err: Error, result: any) => {
        return err ? this.fireError(err, reject) : resolve(toValue(result));
      });
    });
  }

  /**
   * Removes a value from the database.
   */
  public async del<K extends keyof D>(key: K) {
    this.throwIfDisposed('delete');
    return new Promise<t.IDbValue<K, D[K]>>((resolve, reject) => {
      this._.db.del(key, (err: Error, result: any) => {
        return err ? this.fireError(err, reject) : resolve(toValue(result));
      });
    });
  }

  /**
   * Starts a watcher for the given key/path.
   * Pass nothing to watch for all changes.
   */
  public watch(...pattern: string[]) {
    this.throwIfDisposed('watch');
    pattern = formatWatchPatterns(pattern);

    const storeRef = (key: string, watcher: WatcherRef) => {
      this.unwatch(key);
      this._.watchers[key] = watcher;
    };

    pattern.forEach(pattern => {
      const match = pattern === '*' ? '' : pattern; // NB: wildcard is matched as empty-string.
      const watcher = this._.db.watch(match, () => {
        watcher._nodes.forEach(async ({ key, value, deleted }: any) => {
          const version = await this.version();
          this.next<t.IDbWatchEvent>('DB/watch', {
            key,
            value: formatValue(value),
            pattern,
            deleted,
            version,
          });
        });
      });
      storeRef(pattern, watcher);
    });
    return this;
  }

  /**
   * Removes the watcher for the given key/path.
   * Pass nothing to turn-off all watchers.
   */
  public unwatch(...pattern: string[]) {
    const watchers = this._.watchers;
    pattern = Array.isArray(pattern) ? pattern : [pattern];
    pattern = pattern.length === 0 ? Object.keys(this._.watchers) : formatWatchPatterns(pattern);
    pattern.forEach(key => {
      if (watchers[key]) {
        watchers[key].destroy();
      }
    });
  }

  /**
   * [INTERNAL]
   */
  private fireError(error: Error, reject?: (reason: any) => void) {
    this.next<t.IDbErrorEvent>('DB/error', { error });
    if (reject) {
      reject(error);
    }
  }

  private next<E extends t.DbEvent>(type: E['type'], payload: E['payload']) {
    const e = { type, payload };
    this._.events$.next(e as t.DbEvent);
  }

  private throwIfDisposed(action: string) {
    if (this.isDisposed) {
      const msg = `Cannot '${action}' because the [HyperDb] client has been disposed.`;
      throw new Error(msg);
    }
  }
}

/**
 * [HELPER_FUNCTIONS]
 */
function toValue<K, V>(result: any): t.IDbValue<K, V> {
  const exists = result && !isNil(result.value);
  const value = exists ? formatValue<V>(result.value) : undefined;
  result = { exists, ...result };
  delete result.value;
  return {
    value,
    meta: result as t.IDbValueMeta<K>,
  };
}

function formatValue<V>(value: any) {
  return isNil(value) ? undefined : (valueUtil.toType(value) as V);
}

function isNil(value: any) {
  return value === null || value === undefined;
}

function formatWatchPatterns(pattern: string[]) {
  const asWildcard = (pattern: string) => (pattern === '' ? '*' : pattern);
  pattern = Array.isArray(pattern) ? pattern : [pattern];
  pattern = pattern.length === 0 ? ['*'] : pattern; // NB: Watch for all changes if no specific paths were given.
  pattern = pattern.map(p => p.trim()).map(p => asWildcard(p));
  return pattern;
}
