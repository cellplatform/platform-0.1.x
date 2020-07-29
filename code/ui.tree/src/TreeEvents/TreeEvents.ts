import { Observable, Subject } from 'rxjs';
import { filter, map, share, takeUntil } from 'rxjs/operators';

import { t } from '../common';

type N = t.ITreeViewNode;
type E = t.TreeViewEvent;
type Button = t.MouseEvent['button'];
type Target = t.TreeViewMouseTarget;

/**
 * Helpers for filtering different event streams for a tree with sensible defaults.
 */
export class TreeEvents<T extends N = N> implements t.ITreeEvents<T> {
  public static create<T extends N = N>(
    event$: Observable<E>,
    dispose$?: Observable<any>,
  ): t.ITreeEvents<T> {
    return new TreeEvents<T>(event$, dispose$);
  }

  /**
   * [Lifecycle]
   */
  private constructor(event$: Observable<E>, dispose$?: Observable<any>) {
    this.treeview$ = event$.pipe(takeUntil(this.dispose$));
    if (dispose$) {
      dispose$.subscribe(() => this.dispose());
    }
  }

  public dispose() {
    this._dispose$.next();
    this._dispose$.complete();
  }

  /**
   * [Fields]
   */
  private _render: t.ITreeRenderEvents<T>;
  public readonly treeview$: Observable<E>;

  private readonly _dispose$ = new Subject<void>();
  public readonly dispose$ = this._dispose$.pipe(share());

  /**
   * [Properties]
   */
  public get isDisposed() {
    return this._dispose$.isStopped;
  }

  public get render() {
    if (!this._render) {
      const event$ = this.treeview$.pipe(
        filter((e) => e.type.startsWith('TREEVIEW/render/')),
        map((e) => e as t.TreeViewRenderEvent),
      );
      const $ = event$.pipe(map((e) => e.payload as t.TreeViewRenderEvent['payload']));
      const icon$ = event$.pipe(
        filter((e) => e.type === 'TREEVIEW/render/icon'),
        map((e) => e.payload as t.ITreeViewRenderIcon<T>),
      );
      const nodeBody$ = event$.pipe(
        filter((e) => e.type === 'TREEVIEW/render/nodeBody'),
        map((e) => e.payload as t.ITreeViewRenderNodeBody<T>),
      );
      const panel$ = event$.pipe(
        filter((e) => e.type === 'TREEVIEW/render/panel'),
        map((e) => e.payload as t.ITreeViewRenderPanel<T>),
      );
      const header$ = event$.pipe(
        filter((e) => e.type === 'TREEVIEW/render/header'),
        map((e) => e.payload as t.ITreeViewRenderHeader<T>),
      );
      this._render = { $, icon$, nodeBody$, panel$, header$ };
    }
    return this._render;
  }

  /**
   * [Methods]
   */
  public mouse$ = (
    options: { button?: Button | Button[]; type?: t.MouseEventType; target?: Target } = {},
  ) => {
    const { type, target } = options;
    const buttons = toButtons(options.button);

    return this.treeview$.pipe(
      filter((e) => e.type === 'TREEVIEW/mouse'),
      map((e) => e.payload as t.ITreeViewMouse<T>),
      filter((e) => {
        if (buttons.includes('RIGHT') && type === 'CLICK' && e.type === 'UP') {
          // NB: The CLICK event for a right button does not fire from the DOM
          //     so catch this pattern and return it as a "right-click" as its
          //     actually logical.
          return true;
        }
        return type ? e.type === type : true;
      }),
      filter((e) => buttons.includes(e.button)),
      filter((e) => (target ? e.target === target : true)),
    );
  };

  public mouse(options: { button?: Button | Button[] } = {}) {
    const button = toButtons(options.button);
    const mouse$ = this.mouse$;
    const targets = (type: t.MouseEventType) => {
      const args = { button, type };
      return {
        get $() {
          return mouse$({ ...args });
        },
        get node$() {
          return mouse$({ ...args, target: 'NODE' });
        },
        get drillIn$() {
          return mouse$({ ...args, target: 'DRILL_IN' });
        },
        get parent$() {
          return mouse$({ ...args, target: 'PARENT' });
        },
        get twisty$() {
          return mouse$({ ...args, target: 'TWISTY' });
        },
      };
    };
    return {
      get click() {
        return targets('CLICK');
      },
      get dblclick() {
        return targets('DOUBLE_CLICK');
      },
      get down() {
        return targets('DOWN');
      },
      get up() {
        return targets('UP');
      },
      get enter() {
        return targets('ENTER');
      },
      get leave() {
        return targets('LEAVE');
      },
    };
  }
}

/**
 * [Helpers]
 */

function toButtons(input?: Button | Button[], defaultValue: Button[] = ['LEFT']) {
  const buttons: Button[] = !input ? [] : Array.isArray(input) ? input : [input];
  return buttons.length === 0 ? defaultValue : buttons;
}
