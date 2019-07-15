import { IpcClient } from '@platform/electron/lib/types';
import {
  DbEvent,
  IDb,
  IDbFindResult,
  IDbKeyValue,
  IDbQuery,
  IDbValue,
} from '@platform/fs.db/lib/types';

export type DbIpc = IpcClient<DbIpcEvent>;
export type DbFactory = (dir: string) => IDb;

/**
 * IPC Events
 */
export type DbIpcEvent =
  | IDbIpcGetEvent
  | IDbIpcFindEvent
  | IDbIpcPutEvent
  | IDbIpcDeleteEvent
  | IDbIpcDbFiredEvent
  | IDbIpcOpenFolderEvent;

export type IDbIpcGetResponse = { values: IDbValue[] };
export type IDbIpcGetEvent = {
  type: 'DB/get';
  payload: { dir: string; keys: string[] };
};

export type IDbIpcFindResponse = { result: IDbFindResult };
export type IDbIpcFindEvent = {
  type: 'DB/find';
  payload: { dir: string; query: IDbQuery };
};

export type IDbIpcPutResponse = { values: IDbValue[] };
export type IDbIpcPutEvent = {
  type: 'DB/put';
  payload: { dir: string; items: IDbKeyValue[] };
};

export type IDbIpcDeleteResponse = { values: IDbValue[] };
export type IDbIpcDeleteEvent = {
  type: 'DB/delete';
  payload: { dir: string; keys: string[] };
};

export type IDbIpcDbFired = { dir: string; event: DbEvent };
export type IDbIpcDbFiredEvent = {
  type: 'DB/fired';
  payload: IDbIpcDbFired;
};

export type IDbIpcOpenFolder = { db: string };
export type IDbIpcOpenFolderEvent = {
  type: 'DB/open/folder';
  payload: IDbIpcOpenFolder;
};
