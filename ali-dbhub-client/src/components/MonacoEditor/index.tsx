import React, { memo, useEffect, useRef, useState } from 'react';
import styles from './index.less';
import classnames from 'classnames';
import { setLocaleData } from 'monaco-editor-nls';
const monaco = require('monaco-editor/esm/vs/editor/editor.api');
import zh_CN from 'monaco-editor-nls/locale/zh-hans.json';
setLocaleData(zh_CN);
import { language } from 'monaco-editor/esm/vs/basic-languages/sql/sql';
const { keywords } = language;
import { useTheme } from '@/utils/hooks';


interface IProps {
  id: string;
  onChange: Function;
  className?: string;
  height?: number;
  getEditor: any;
}

export default memo(function MonacoEditor(props: IProps) {
  const { className, getEditor, id = 0, onChange } = props;
  const [editor, setEditor] = useState<any>();
  const themeColor = useTheme();

  useEffect(() => {
    const editor = monaco.editor.create(document.getElementById(`monaco-editor-${id}`)!, {
      value: '',
      language: 'sql',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      folding: false, // 不显示折叠
      minimap: {
        enabled: false // 是否启用预览图
      }, // 预览图设置
      theme: localStorage.getItem('theme') == 'default' ? 'default' : 'vs-dark',
      tabSize: 2,
      insertSpaces: true,
      autoClosingQuotes: "always",
      detectIndentation: false,
      automaticLayout: true,
      wordWrap: "on",
      fixedOverflowWidgets: true,
      fontSize: 12,
      lineHeight: 18,
      padding: {
        top: 2,
        bottom: 2,
      },
      renderLineHighlight: "none",
      codeLens: false,
      scrollbar: {
        alwaysConsumeMouseWheel: false,
      },
    });
    // 自定义命令
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const value = editor.getValue();
    });

    editor.onDidChangeModelContent(() => {
      onChange()
    })

    // 自定义菜单 TODO:

    window.onresize = function () {
      editor.layout()
    };
    getEditor(editor)
    setEditor(editor)
    monaco.editor.defineTheme('BlackTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [{ background: '#15161a' }],
      colors: {
        // 相关颜色属性配置
        'editor.foreground': '#ffffff',
        'editor.background': '#15161a',     //背景色
        'editor.inactiveSelectionBackground': '#ff0000'
      }
    });

    monaco.editor.defineTheme('Default1', {
      base: 'vs',
      inherit: true,
      rules: [{ background: '#15161a' }],
      colors: {
        'editor.foreground': '#000000',
        'editor.background': '#f8f8fa',     //背景色
      }
    });
  }, [])

  useEffect(() => {
    monaco.editor.setTheme(themeColor == 'dark' ? 'BlackTheme' : 'Default');
  }, [themeColor])

  // 设置编辑器的值
  const setValue = (editor: any, value: string) => {
    const model = editor.getModel(editor)
    model.setValue(value)
  }

  // 获取编辑器的值
  const getValue = () => {
    if (editor?.getModel) {
      const model = editor.getModel(editor)
      const value = model.getValue()
      return value
    }
  }

  return <div className={classnames(className, styles.box)}>
    <div id={`monaco-editor-${id}`} className={styles.editorContainer} />
  </div>
});

export interface IHintData {
  [keys: string]: string[]
}

export function setEditorHint(hintData: IHintData) {
  // 获取 SQL 语法提示
  const getSQLSuggest = () => {
    return keywords.map((key: any) => ({
      label: key,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: key,
      detail: '<keywords>'
    }))
  }

  // 获取一级数据
  const getFirstSuggest = () => {
    return Object.keys(hintData).map((key) => ({
      label: key,
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: key,
      detail: '<Database>'
    }))
  }

  // 获取二级数据
  const getSecondSuggest = (keys: string) => {
    const secondNames = hintData[keys]
    if (!secondNames) {
      return []
    }
    return secondNames?.map((name: any) => ({
      label: name,
      kind: monaco.languages.CompletionItemKind.片段,
      insertText: name,
      detail: '<Table>'
    }))
  }

  // 编辑器提示的提示实力
  const editorHintExamples = monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: ['.', ' ', ...keywords],
    provideCompletionItems: (model: any, position: any) => {
      let suggestions: any = []
      const { lineNumber, column } = position
      const textBeforePointer = model.getValueInRange({
        startLineNumber: lineNumber,
        startColumn: 0,
        endLineNumber: lineNumber,
        endColumn: column,
      })

      const tokens = textBeforePointer.trim().split(/\s+/)
      const lastToken = tokens[tokens.length - 1] // 获取最后一段非空字符串

      if (lastToken.endsWith('.')) {
        const tokenNoDot = lastToken.slice(0, lastToken.length - 1)
        suggestions = [...getSecondSuggest(tokenNoDot)]
      } else if (lastToken === '.') {
        suggestions = []
      } else {
        suggestions = [...getFirstSuggest(), ...getSQLSuggest()]
      }
      return {
        suggestions
      }
    },
  })

  return editorHintExamples
}
