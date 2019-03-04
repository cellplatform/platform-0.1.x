import { Subject } from 'rxjs';
import { filter, map, share, takeUntil } from 'rxjs/operators';

import { ICommand, value as valueUtil } from './libs';
import * as t from './types';

const minimist = require('minimist');

type ICommandStateArgs = {
  root: ICommand;
};

/**
 * Manages state of a CLI program.
 */
export class CommandState<P extends object = any> implements t.ICommandState<P> {
  /**
   * [Static]
   */
  public static create<P extends object = any>(args: ICommandStateArgs) {
    return new CommandState<P>(args);
  }

  public static parse<P extends object = any>(text: string): t.IParsedCommand<P> {
    const params = minimist(text.split(' '));
    const commands = (params._ || [])
      .filter((e: any) => Boolean(e))
      .map((e: any) => valueUtil.toType(e));
    delete params._;
    Object.keys(params).forEach(key => (params[key] = valueUtil.toType(params[key])));
    return { commands, params };
  }

  /**
   * [Constructor]
   */
  private constructor(args: ICommandStateArgs) {
    const { root } = args;
    if (!root) {
      throw new Error(`A root [Command] spec must be passed to the state constructor.`);
    }

    this._.root = root;
  }

  /**
   * [Fields]
   */
  private readonly _ = {
    dispose$: new Subject(),
    events$: new Subject<t.CommandEvent>(),
    root: (undefined as unknown) as ICommand,
    text: '',
  };

  public readonly dispose$ = this._.dispose$.pipe(share());
  public readonly events$ = this._.events$.pipe(
    takeUntil(this._.dispose$),
    share(),
  );
  public readonly change$ = this.events$.pipe(
    filter(e => e.type === 'COMMAND/change'),
    map(e => e.payload),
    share(),
  );
  public readonly invoke$ = this.events$.pipe(
    filter(e => e.type === 'COMMAND/invoke'),
    map(e => e.payload),
    share(),
  );

  /**
   * [Properties]
   */
  public get isDisposed() {
    return this._.dispose$.isStopped;
  }

  public get root() {
    return this._.root;
  }

  public get text() {
    return this._.text;
  }

  public get command() {
    const cmd = this.argv.commands[0];
    return cmd ? this.root.children.find(c => c.title === cmd) : undefined;
  }

  public get argv() {
    return CommandState.parse(this.text);
  }

  public get params() {
    return this.argv.params;
  }

  /**
   * [Methods]
   */
  public onChange: t.CommandChangeDispatcher = e => {
    const { text, invoked } = e;
    const events$ = this._.events$;
    this._.text = text;
    const payload = this.toObject();
    events$.next({ type: 'COMMAND/change', payload });
    if (invoked) {
      events$.next({ type: 'COMMAND/invoke', payload });
    }
  };

  public dispose() {
    this._.dispose$.next();
    this._.dispose$.complete();
  }

  public toString() {
    return this.text;
  }

  public toObject() {
    const text = this.text;
    const command = this.command;
    const params = this.params;
    return { text, command, params };
  }
}
