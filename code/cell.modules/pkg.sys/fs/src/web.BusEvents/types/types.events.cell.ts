import { t } from './common';

type FilesystemId = string;
type FilePath = string;

/**
 * EVENTS
 */
export type SysFsCellEvent =
  | SysFsCellPushReqEvent
  | SysFsCellPushResEvent
  | SysFsCellPullReqEvent
  | SysFsCellPullResEvent;

/**
 * Push files to a remote cell.
 */
export type SysFsCellPushReqEvent = {
  type: 'sys.fs/cell/push:req';
  payload: SysFsCellPushReq;
};
export type SysFsCellPushReq = { tx: string; id: FilesystemId };

export type SysFsCellPushResEvent = {
  type: 'sys.fs/cell/push:res';
  payload: SysFsCellPushRes;
};
export type SysFsCellPushRes = { tx: string; id: FilesystemId };

/**
 * Pull files to from a remote cell to the local filesystem.
 */
export type SysFsCellPullReqEvent = {
  type: 'sys.fs/cell/pull:req';
  payload: SysFsCellPullReq;
};
export type SysFsCellPullReq = { tx: string; id: FilesystemId };

export type SysFsCellPullResEvent = {
  type: 'sys.fs/cell/pull:res';
  payload: SysFsCellPullRes;
};
export type SysFsCellPullRes = { tx: string; id: FilesystemId };