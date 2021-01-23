import { t } from './common';

type O = Record<string, unknown>;
type B<Ctx extends O> = DevActionModelBuilder<Ctx>;

/**
 * Model Builder API
 */
export type DevActionModelBuilder<Ctx extends O> = t.BuilderChain<DevActionModelMethods<Ctx>>;

export type DevActionModelMethods<Ctx extends O> = DevActionModelInputMethods<Ctx> & {
  toObject(): t.DevActionModel<Ctx>;
  toContext(): Ctx;
  clone(ctx?: t.DevActionGetContext<Ctx>): B<Ctx>;

  renderList(bus: t.EventBus, props?: t.ActionPanelProps): JSX.Element;
  renderSubject(): t.DevActionSubject;

  merge(actions: DevActionModelBuilder<any>, options?: DevActionAddOptions): B<Ctx>;
  context(factory: t.DevActionGetContext<Ctx>): B<Ctx>;
  subject(factory: t.DevActionRenderSubject<Ctx>): B<Ctx>;
};

export type DevActionAddOptions = { insertAt?: 'end' | 'start' };

export type DevActionModelInputMethods<Ctx extends O> = {
  button(label: string, handler?: t.DevActionHandler<Ctx>): B<Ctx>;
  button(config: DevActionButtonConfig<Ctx>): B<Ctx>;
  hr(height?: number, opacity?: number, margin?: t.DevEdgeSpacing): B<Ctx>;
  hr(config?: DevActionHrConfig<Ctx>): B<Ctx>;
  title(text: string, config?: DevActionTitleConfig<Ctx>): B<Ctx>;
  title(config: DevActionTitleConfig<Ctx>): B<Ctx>;
};

/**
 * Button
 */
export type DevActionButtonConfig<Ctx extends O> = (args: DevActionButtonConfigArgs<Ctx>) => void;
export type DevActionButtonConfigArgs<Ctx extends O> = {
  label(value: string): DevActionButtonConfigArgs<Ctx>;
  description(value: string): DevActionButtonConfigArgs<Ctx>;
  onClick(handler: t.DevActionHandler<Ctx>): DevActionButtonConfigArgs<Ctx>;
};

/**
 * Hr (Horizontal Rule)
 */
export type DevActionHrConfig<Ctx extends O> = (args: DevActionHrConfigArgs<Ctx>) => void;
export type DevActionHrConfigArgs<Ctx extends O> = {
  height(value: number): DevActionHrConfigArgs<Ctx>;
  opacity(value: number): DevActionHrConfigArgs<Ctx>;
  margin(value: t.DevEdgeSpacing): DevActionHrConfigArgs<Ctx>;
};

/**
 * Title
 */
export type DevActionTitleConfig<Ctx extends O> = (args: DevActionTitleConfigArgs<Ctx>) => void;
export type DevActionTitleConfigArgs<Ctx extends O> = {
  text(value: string): DevActionTitleConfigArgs<Ctx>;
};
