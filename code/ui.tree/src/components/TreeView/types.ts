import * as t from '../../types';


/**
 * [Events]
 */
export type TreeViewEvent = ITreeViewMouseEvent | ITreeViewFocusEvent;

export type ITreeViewMouseEvent = {
  type: 'TREEVIEW/mouse';
  payload: t.TreeNodeMouseEvent;
};

export type ITreeViewFocusEvent = {
  type: 'TREEVIEW/focus';
  payload: ITreeViewFocus;
};
export type ITreeViewFocus = { isFocused: boolean };
