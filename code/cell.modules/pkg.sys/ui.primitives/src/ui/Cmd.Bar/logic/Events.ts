import { animationFrameScheduler, Subject } from 'rxjs';
import { filter, observeOn, takeUntil } from 'rxjs/operators';

import { rx, t, Json } from '../common';

/**
 * Event API.
 */
export function CmdBarEvents(args: {
  instance: t.CmdBarInstance;
  dispose$?: t.Observable<any>;
}): t.CmdBarEventsDisposable {
  const dispose$ = new Subject<void>();
  const dispose = () => rx.done(dispose$);
  args.dispose$?.subscribe(dispose);

  const instance = args.instance.id;
  const bus = rx.busAsType<t.CmdBarEvent>(args.instance.bus);

  const $ = bus.$.pipe(
    takeUntil(dispose$),
    filter((e) => e.payload.instance === instance),
    filter((e) => e.type.startsWith('sys.ui.CmdBar/')),
    observeOn(animationFrameScheduler),
  );

  const events = Json.Bus.Events({ instance: args.instance, dispose$ });

  const action: t.CmdBarEvents['action'] = {
    $: rx.payload<t.CmdBarActionEvent>($, 'sys.ui.CmdBar/Action'),
    fire(args) {
      const { text, kind } = args;
      bus.fire({
        type: 'sys.ui.CmdBar/Action',
        payload: { instance, text, kind },
      });
    },
  };

  const text: t.CmdBarEvents['text'] = {
    changed$: rx.payload<t.CmdBarTextChangeEvent>($, 'sys.ui.CmdBar/TextChanged'),
    change(args) {
      const { from, to } = args;
      bus.fire({
        type: 'sys.ui.CmdBar/TextChanged',
        payload: { instance, from, to },
      });
    },
  };

  /**
   * API
   */
  const api: t.CmdBarEventsDisposable = {
    instance: events.instance,
    $,
    dispose,
    dispose$,
    action,
    text,
    clone() {
      const clone = { ...api };
      delete (clone as any).dispose;
      return clone;
    },
  };
  return api;
}
