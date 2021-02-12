import { t } from '../common';

type O = Record<string, unknown>;

/**
 * INPUT: A Button with a toggle switch (boolean).
 */
export type ActionBoolean = t.ActionBooleanProps & {
  id: string;
  kind: 'dev/boolean';
  handlers: t.ActionBooleanHandler<any>[];
};

/**
 * CONFIGURE Boolean (Switch)
 */
export type ActionBooleanConfig<Ctx extends O> = (args: ActionBooleanConfigArgs<Ctx>) => void;
export type ActionBooleanConfigArgs<Ctx extends O> = {
  ctx: Ctx;
  label(value: string | t.ReactNode): ActionBooleanConfigArgs<Ctx>;
  description(value: string | t.ReactNode): ActionBooleanConfigArgs<Ctx>;
  pipe(...handlers: t.ActionBooleanHandler<Ctx>[]): ActionBooleanConfigArgs<Ctx>;
};

/**
 * Editable properties of a [Boolean] button.
 */
export type ActionBooleanProps = {
  label: string | t.ReactNode;
  description?: string | t.ReactNode;
  current?: boolean; // Latest value produced by the handler.
};

export type ActionBooleanChanging = { next: boolean };

/**
 * HANDLER Boolean (switch)
 */
export type ActionBooleanHandler<C> = (e: t.ActionBooleanHandlerArgs<C>) => void;
export type ActionBooleanHandlerArgs<C> = t.ActionHandlerArgs<C> & {
  readonly settings: t.ActionHandlerSettings<
    ActionBooleanHandlerArgs<C>,
    ActionHandlerSettingsBooleanArgs
  >;
  readonly boolean: t.ActionBooleanProps;
  readonly changing?: t.ActionBooleanChanging; // Exists when an interaction has causes the state to change.
};
export type ActionHandlerSettingsBooleanArgs = t.ActionHandlerSettingsArgs & {
  boolean?: Partial<t.ActionBooleanProps>;
};