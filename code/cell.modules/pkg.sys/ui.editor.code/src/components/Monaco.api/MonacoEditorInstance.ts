import { Subject } from 'rxjs';
import { share, takeUntil } from 'rxjs/operators';

import { slug, t } from '../../common';

export type MonacoEditorInstanceArgs = {
  instance: t.IMonacoStandaloneCodeEditor;
  id?: string;
  event$?: t.Subject<t.CodeEditorEvent>;
};

// Types per file
//    https://stackoverflow.com/questions/43058191/how-to-use-addextralib-in-monaco-with-an-external-type-definition

// Multi-cursor
//    https://github.com/Microsoft/monaco-editor/issues/366

/**
 * API helpers for manipulating an [IMonacoStandaloneCodeEditor] instance.
 *
 * Refs:
 *    https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.istandalonecodeeditor.html
 *
 */
export const MonacoEditorInstance = (args: MonacoEditorInstanceArgs): t.IMonacoInstance => {
  const { instance } = args;
  const id = args.id || slug();

  const dispose$ = new Subject<void>();
  const event$ = new Subject<t.MonacoEvent>();
  const fire = (e: t.MonacoEvent) => event$.next(e);

  const listeners = {
    contentChanged: instance.onDidChangeModelContent((e) => {
      fire({
        type: 'Monaco/changed:content',
        payload: { instance: id, ...e },
      });
    }),
    cursorChanged: instance.onDidChangeCursorPosition((e) => {
      fire({
        type: 'Monaco/changed:cursorPosition',
        payload: { instance: id, ...e },
      });
    }),
    selectionChanged: instance.onDidChangeCursorSelection((e) => {
      fire({
        type: 'Monaco/changed:cursorSelection',
        payload: { instance: id, ...e },
      });
    }),
  };

  const api = {
    id,
    instance,
    event$: event$.pipe(takeUntil(dispose$), share()),
    dispose$: dispose$.pipe(share()),

    /**
     * Assign focus to the editor.
     */
    focus() {
      instance.focus();
    },

    /**
     * Get/set the value of the code editor.
     */
    get value() {
      return instance.getValue();
    },
    set value(value: string) {
      instance.setValue(value);
    },

    /**
     * Destroy all handlers.
     */
    dispose() {
      Object.keys(listeners).forEach((key) => listeners[key].dispose());
      dispose$.next();
      dispose$.complete();
      event$.complete();
    },
  };

  // Bubble events.
  if (args.event$) {
    api.event$.subscribe((e) => args.event$?.next(e));
  }

  return api;
};
