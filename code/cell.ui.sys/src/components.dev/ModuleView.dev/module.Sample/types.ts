import { t } from '../../../common';

export * from '../../../common/types';

export type MyView = 'TREE' | 'DIAGRAM' | 'SAMPLE' | 'TREE_COLUMNS' | '404';
export type MyData = { foo?: string | number };
export type MyProps = t.IModuleProps<MyData, MyView>;
export type MyModule = t.IModule<MyProps>;

export type MyContext = {
  bus: t.EventBus<any>;
};
