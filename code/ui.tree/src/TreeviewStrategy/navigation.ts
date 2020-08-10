import { filter, takeUntil } from 'rxjs/operators';

import { t } from '../common';
import { dispose } from '@platform/types';
import { TreeEvents } from '../TreeEvents';
import { mutations } from './mutations';

type N = t.ITreeviewNode;

export const navigation: t.ITreeviewStrategyConstructor = (ctx, disposable) => {
  return {
    listen(event$, until$) {
      const api = disposable ? dispose.until(disposable, until$) : dispose.create(until$);
      event$ = event$.pipe(takeUntil(api.dispose$));

      const events = TreeEvents.create(event$, api.dispose$);
      const mutate = mutations(ctx.root);

      const getParent = (node: N) => {
        return ctx.root.query.ancestor(node, (e) => {
          const node = e.node as N;
          return e.level > 0 && !node.props?.treeview?.inline;
        });
      };

      /**
       * EVENTS: Left mouse button.
       */
      const left = events.mouse('LEFT');

      /**
       * BEHAVIOR: Set as selected when node is single-clicked.
       */
      left.down.node$.subscribe((e) => mutate.selected(e.id));

      /**
       * BEHAVIOR: Step up to parent when the "back" button is
       *           single-clicked on the panel header.
       */
      left.down.parent$.subscribe((e) => mutate.current(getParent(e.node)?.id));

      /**
       * BEHAVIOR: Navigate into child when the "drill in chevron"
       *           is single-clicked.
       */
      left.down.drillIn$.subscribe((e) => mutate.current(e.id));

      /**
       * BEHAVIOR: Toggle open/closed an inline node when
       *           it's "twisty" is single-clicked.
       */
      left.down.twisty$
        .pipe(
          filter((e) => Boolean((e.props || {}).inline)),
          filter((e) => (e.children || []).length > 0),
        )
        .subscribe((e) => mutate.toggleOpen(e.id));

      /**
       * EVENTS: Double-clicked node that has children.
       */
      const dblClickNodeWithChildren$ = left.dblclick.node$.pipe(
        filter((e) => (e.children || []).length > 0),
      );

      /**
       * BEHAVIOR: Navigate into child when a node is double-clicked.
       */
      dblClickNodeWithChildren$
        .pipe(filter((e) => !(e.props || {}).inline))
        .subscribe((e) => mutate.current(e.id));

      /**
       * BEHAVIOR: Toggle open/closed an inline node when
       *           it's double-clicked.
       */
      dblClickNodeWithChildren$
        .pipe(filter((e) => Boolean((e.props || {}).inline)))
        .subscribe((e) => mutate.toggleOpen(e.id));

      return api;
    },
  };
};
