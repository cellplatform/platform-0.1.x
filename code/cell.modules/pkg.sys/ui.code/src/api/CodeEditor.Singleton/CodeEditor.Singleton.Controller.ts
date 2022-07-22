import { rx, t, R } from '../common';
import { CodeEditorEvents } from '../Events';
import { staticPaths } from '../Configure/Configure.paths';

/**
 * Singleton controller for an environment.
 */
export function CodeEditorSingletonController(input: t.EventBus<any>) {
  const bus = rx.busAsType<t.CodeEditorEvent>(input);
  const events = CodeEditorEvents(bus);

  let _status: t.CodeEditorStatus = {
    initialized: false,
    paths: staticPaths(),
  };

  /**
   * Status
   */
  events.status.req$.subscribe((e) => {
    const { tx } = e;
    const info = R.clone(_status);
    bus.fire({
      type: 'sys.ui.code/status:res',
      payload: { tx, info },
    });
  });

  /**
   * Initialize
   */
  events.init.req$.subscribe((e) => {
    const { tx } = e;

    _status = {
      ..._status,
      initialized: true,
      paths: staticPaths(e.staticRoot),
    };

    const info = R.clone(_status);

    bus.fire({
      type: 'sys.ui.code/init:res',
      payload: { tx, info },
    });
  });

  // Finish up.
  return events;
}