import { t } from '../common';

/**
 * Runtime: node-js.
 */
export type RuntimeEnvNode = t.RuntimeMembers & {
  name: 'cell.runtime.node';
  stdlibs: t.RuntimeNodeAllowedStdlib[];
};

/**
 * Node-js standard libraries that may be made available
 * to the runtime running within the sandbox.
 *
 * By default no standard libs are exposed to the executing code.
 *
 * NOTE:
 *    It is preferred to delegate execution of priviledged
 *    actions via the event-bus.
 *
 */
export type RuntimeNodeAllowedStdlib = RuntimeNodeStdlib | '*';
export type RuntimeNodeStdlib =
  | 'fs'
  | 'os'
  | 'tty'
  | 'url'
  | 'path'
  | 'crypto'
  | 'http'
  | 'http2'
  | 'events'
  | 'net'
  | 'domain'
  | 'dns'
  | 'cluster'
  | 'child_process'
  | 'buffer'
  | 'async_hooks'
  | 'assert'
  | 'util';
