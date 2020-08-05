import { TreeState } from '@platform/state';
import { filter } from 'rxjs/operators';

import { t } from '../common';
import { publish } from './Module.pub';
import { subscribe } from './Module.sub';
import * as events from './Module.events';
import { ModuleStrategies } from './strategies';
import { create } from './Module.create';

const identity = TreeState.identity;

type O = Record<string, unknown>;

export class Module {
  /**
   * Helpers for working with tree ids.
   */
  public static identity = TreeState.identity;

  /**
   * Index of common behavior strategies.
   */
  public static strategies = ModuleStrategies;

  /**
   * Create a new module.
   */
  public static create = create;

  /**
   * Register a new module within the tree, providing a promise/callback
   * that returns the registered module.
   */
  public static async register(parent: t.IModule, args: { id: string; name?: string }) {
    return new Promise<t.IModule>((resolve) => {
      const payload: t.IModuleRegister = { module: args.id, name: args.name };
      parent
        .action()
        .dispatched<t.IModuleRegisteredEvent>('Module/registered')
        .pipe(
          filter((e) => e.module === payload.module || identity.key(e.module) === payload.module),
        )
        .subscribe((e) => {
          const child = parent.find((item) => item.id === e.module);
          resolve(child);
        });
      parent.dispatch({ type: 'Module/register', payload });
    });
  }

  /**
   * Broadcasts events from the module (and all child modules)
   * throw the given pipe (fire).
   */
  public static publish = publish;
  public static subscribe = subscribe;

  /**
   * Construct an event helper.
   */
  public static events = events.create;
  public static filter = events.filterEvent;
  public static isModuleEvent = events.isModuleEvent;
}
