import MonacoEditorCore, { EditorDidMount } from '@monaco-editor/react';
import React, { useRef } from 'react';

import { CodeEditor } from '../../api';

import { css, CssValue, DEFAULT, t } from '../../common';

type E = t.IMonacoStandaloneCodeEditor;

export type MonacoEditorReadyEvent = { instance: E; singleton: t.ICodeEditorSingleton };
export type MonacoEditorReadyEventHandler = (e: MonacoEditorReadyEvent) => void;

export type MonacoEditorProps = {
  bus: t.EventBus<any>;
  language?: t.CodeEditorLanguage;
  theme?: t.CodeEditorTheme;
  loading?: React.ReactNode;
  style?: CssValue;
  onReady?: MonacoEditorReadyEventHandler;
};

/**
 * Minimal wrapper around a vanilla [Monaco] editor.
 *
 * Refs:
 *    https://github.com/suren-atoyan/monaco-react
 *    https://microsoft.github.io/monaco-editor/api
 *
 */
export const MonacoEditor: React.FC<MonacoEditorProps> = (props) => {
  const editorRef = useRef<E>();
  const { language = DEFAULT.LANGUAGE.TS, theme = DEFAULT.THEME } = props;

  const onMount: EditorDidMount = async (getValue, ed) => {
    const monaco = await CodeEditor.singleton(props.bus);
    const editor = ed as any;
    editorRef.current = editor;
    if (props.onReady) {
      props.onReady({ instance: editor, singleton: monaco });
    }
  };

  const styles = {
    base: css({ Absolute: 0 }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <MonacoEditorCore
        language={language}
        theme={theme}
        editorDidMount={onMount}
        loading={props.loading}
        options={{
          minimap: { enabled: true },
        }}
      />
    </div>
  );
};

/**
 * Default export.
 */
export default MonacoEditor;