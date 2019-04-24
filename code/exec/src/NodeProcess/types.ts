export type NodeProcessArgs = {
  dir: string;
  port?: number;
};

/**
 * [Events]
 */
export type NodeProcessEvent =
  | INodeProcessStarting
  | INodeProcessStarted
  | INodeProcessStopping
  | INodeProcessStopped;

export type INodeProcessStarting = {
  type: 'PROCESS/starting';
  payload: { dir: string; port?: number; isCancelled: boolean; cancel(): void };
};
export type INodeProcessStarted = {
  type: 'PROCESS/started';
  payload: { dir: string; port?: number };
};

export type INodeProcessStopping = {
  type: 'PROCESS/stopping';
  payload: { dir: string; port?: number; isCancelled: boolean; cancel(): void };
};
export type INodeProcessStopped = {
  type: 'PROCESS/stopped';
  payload: { dir: string; port?: number };
};
