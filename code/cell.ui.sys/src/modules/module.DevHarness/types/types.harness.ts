import { t } from '../common';
import { ILayoutProps } from '../components/Layout';
import { IWindowProps } from '../components/Window';

export type HarnessDef = {
  Window: (props?: IWindowProps) => JSX.Element;
  Layout: (props?: ILayoutProps) => JSX.Element;
  module(bus: t.EventBus): HarnessModule;
  dev: t.DevFactory;
};

/**
 * Harness
 * (the module that "harnesses" another "module under development")
 */

export type HarnessView = 'Host/component' | 'Host/module/TMP' | 'Null' | '404';
export type HarnessTarget = 'Main' | 'Sidebar';
export type HarnessData = { host?: t.IDevHost };
export type HarnessProps = t.IViewModuleProps<HarnessData, HarnessView, HarnessTarget>;
export type HarnessModule = t.IModule<HarnessProps>;

/**
 * [Events]
 */

export type HarnessEvent = IHarnessAddEvent | IHarnessRenderEvent;
export type HarnessEventPublic = IHarnessAddEvent;

/**
 * Register a new module within the harness.
 */
export type IHarnessAddEvent = {
  type: 'Harness/add';
  payload: IHarnessAdd;
};
export type IHarnessAdd = { module: string };

/**
 * Invoke the renderer logic on the harness.
 */
export type IHarnessRenderEvent = {
  type: 'Harness/render';
  payload: IHarnessRender;
};
export type IHarnessRender = { harness: string; module: string; view?: string };
