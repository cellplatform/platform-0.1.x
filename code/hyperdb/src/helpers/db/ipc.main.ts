import * as t from './types';
import { Db } from './Db.main';
import { Swarm } from '../swarm/main';
import { create } from './main.create';
import { value } from '../common';

type Refs = { [key: string]: { db: Db; swarm: Swarm } };
const refs: Refs = {};

/**
 * The IPC handler on the [main] process that manages DB's.
 */
export function init(args: { ipc: t.IpcClient; log: t.ILog }) {
  const ipc = args.ipc as t.DbIpcClient;
  const log = args.log;

  const createDb = async (args: { dir: string; dbKey?: string; checkoutVersion?: string }) => {
    const { dir, dbKey, checkoutVersion } = args;

    console.log(`\nTODO 🐷  handle checkout version creation of DB \n`);

    // Construct the DB.
    const res = await create({ dir, dbKey });

    // Ferry events to clients.
    const db = res.db;
    db.events$.subscribe(e => ipc.send(e.type, e.payload));

    // Finish up.
    return res;
  };

  const getOrCreateDb = async (args: { dir: string; dbKey?: string; checkoutVersion?: string }) => {
    const { dir, checkoutVersion } = args;
    let refKey = dir;
    refKey = checkoutVersion ? `${refKey}/ver:${checkoutVersion}` : refKey;
    refs[refKey] = refs[refKey] || createDb(args);
    return refs[refKey];
  };

  /**
   * HANDLE state requests from DB `renderer` clients and
   * fire back the latest values.
   */
  ipc.handle<t.IDbGetStateEvent>('DB/state/get', async e => {
    type E = t.IDbUpdateStateEvent;
    type P = E['payload'];
    const { dir, dbKey, checkoutVersion } = e.payload.db;
    const db = (await getOrCreateDb({ dir, dbKey, checkoutVersion })).db;
    try {
      const { key, discoveryKey, localKey, watching, isDisposed } = db;
      const props: t.IDbProps = { key, discoveryKey, localKey, watching, isDisposed };
      const payload: P = { db: { dir }, props };
      ipc.send<E>('DB/state/update', payload);
    } catch (err) {
      const message = `Failed to get state fields of DB '${dir}'. ${err.message}`;
      log.error(message);
    }
  });

  /**
   * HANDLE invoke requests from DB `renderer` clients.
   */
  ipc.handle<t.IDbInvokeEvent, t.IDbInvokeResponse>('DB/invoke', async e => {
    const { method, params } = e.payload;
    const { dir, dbKey, checkoutVersion } = e.payload.db;
    const db = (await getOrCreateDb({ dir, dbKey, checkoutVersion })).db;
    try {
      const fn = db[method] as (...params: any[]) => any;
      const res = fn.apply(db, params);
      const result = value.isPromise(res) ? await res : res;
      return { method, result };
    } catch (err) {
      const message = err.message;
      const error = { message };
      return { method, error };
    }
  });
}
