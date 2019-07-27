import { MouseEvent, MouseEventType } from '@platform/react/lib/types';
import { t } from '../common';

/**
 * [Events]
 */
export type GridEvent =
  | t.EditorEvent
  | IGridReadyEvent
  | IGridRedrawEvent
  | IGridKeydownEvent
  | IGridMouseEvent
  | IGridCellsChangedEvent
  | IGridColumnsChangedEvent
  | IRowsChangedEvent
  | IGridSelectionChangeEvent
  | IGridFocusEvent
  | IGridBlurEvent
  | IGridClipboardEvent
  | IGridUndoEvent;

export type IGridReadyEvent = {
  type: 'GRID/ready';
  payload: { grid: t.IGrid };
};

export type IGridRedrawEvent = {
  type: 'GRID/redraw';
  payload: {};
};

/**
 * Keyboard.
 */
export type IGridKeydownEvent = {
  type: 'GRID/keydown';
  payload: IGridKeydown;
};
export type IGridKeydown = {
  key: KeyboardEvent['key'];
  event: KeyboardEvent;
  grid: t.IGrid;
  isEnter: boolean;
  isEscape: boolean;
  isDelete: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  isCancelled: boolean;
  cancel: () => void;
};

/**
 * Mouse.
 */
export type IGridMouseEvent = {
  type: 'GRID/mouse';
  payload: IGridMouse;
};

export type IGridMouse = MouseEvent & {
  cell: t.GridCellKey;
  cellType: t.GridCellType;
  type: MouseEventType;
  grid: t.IGrid;
  isCancelled: boolean;
  cancel: () => void;
};

/**
 * Cell.
 */
export type GridCellChangeType = 'EDIT' | 'DELETE';
export type IGridCellsChangedEvent = {
  type: 'GRID/cells/changed';
  payload: IGridCellsChanged;
};
export type IGridCellsChanged = {
  source: GridCellChangeType;
  changes: IGridCellChange[];
  isCancelled: boolean;
  cancel(): void;
};

export type IGridCellChange = {
  cell: t.ICell;
  value: { from?: t.CellValue; to?: t.CellValue };
  isCancelled: boolean;
  isChanged: boolean;
  isModified: boolean;
  cancel(): void;
  modify(value: t.CellValue): void;
};

/**
 * Column.
 */
export type IGridColumnsChangedEvent = {
  type: 'GRID/columns/changed';
  payload: IGridColumnsChanged;
};
export type IGridColumnsChanged = {
  from: t.IGridColumns;
  to: t.IGridColumns;
  changes: IGridColumnChange[];
};
export type IGridColumnChange = {
  column: string;
  source: 'UPDATE' | 'RESET' | 'RESET/doubleClick';
  from: t.IGridColumn;
  to: t.IGridColumn;
};

/**
 * Row.
 */
export type IRowsChangedEvent = {
  type: 'GRID/rows/changed';
  payload: IGridRowsChanged;
};
export type IGridRowsChanged = {
  from: t.IGridRows;
  to: t.IGridRows;
  changes: IGridRowChange[];
};
export type IGridRowChange = {
  row: number;
  source: 'UPDATE' | 'UPDATE/cellEdited' | 'RESET' | 'RESET/doubleClick';
  from: t.IGridRow;
  to: t.IGridRow;
};

/**
 * Selection.
 */
export type IGridSelectionChangeEvent = {
  type: 'GRID/selection';
  payload: IGridSelectionChange;
};
export type IGridSelectionChange = {
  grid: t.IGrid;
  from: t.IGridSelection;
  to: t.IGridSelection;
};

/**
 * Focus.
 */
export type IGridFocusEvent = {
  type: 'GRID/focus';
  payload: { grid: t.IGrid };
};
export type IGridBlurEvent = {
  type: 'GRID/blur';
  payload: { grid: t.IGrid };
};

/**
 * Clipboard.
 */
export type IGridClipboardEvent = {
  type: 'GRID/clipboard';
  payload: IGridClipboard;
};
export type IGridClipboard = {
  action: 'COPY' | 'CUT' | 'PASTE';
  grid: t.IGrid;
  selection: t.IGridSelection;
  keys: string[];
};

export type IGridUndoEvent = {
  type: 'GRID/undo';
  payload: IGridUndo;
};
export type IGridUndo = {
  kind: 'UNDO' | 'REDO';
  changes: IGridUndoChange;
};
export type IGridUndoChange = {
  key: string;
  from?: t.CellValue;
  to?: t.CellValue;
};
