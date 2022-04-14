import { filter, takeUntil } from 'rxjs/operators';

import { Json, rx, t, Util, CmdBar } from '../common';

type S = t.CmdCardState;

/**
 * Event API
 */
export function CmdCardEvents(args: t.CmdCardEventsArgs) {
  const { dispose, dispose$ } = rx.disposable(args.dispose$);

  const instance = args.instance.id;
  const bus = rx.busAsType<t.CmdCardEvent>(args.instance.bus);

  const $ = bus.$.pipe(
    takeUntil(dispose$),
    filter((e) => e.type.startsWith('sys.ui.CmdCard/')),
    filter((e) => e.payload.instance === instance),
  );

  const events = Json.Bus.Events({ instance: args.instance, dispose$ });
  const state = events.json<S>(args.initial ?? Util.state.default, { key: 'CmdCard' });
  const commandbar = CmdBar.Events({ instance: args.instance, dispose$ });

  /**
   * API
   */
  const api: t.CmdCardEventsDisposable = {
    instance: events.instance,
    $,
    dispose,
    dispose$,
    state,
    commandbar: {
      focus: commandbar.text.focus,
      blur: commandbar.text.blur,
      select: commandbar.text.select,
      cursor: commandbar.text.cursor,
    },
    clone() {
      return { ...api, dispose: undefined };
    },
  };
  return api;
}