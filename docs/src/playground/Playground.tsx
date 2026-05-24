import React, { useCallback, useMemo, useRef, useState } from 'react';
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import type { ConsoleLevel, RunRequest, RunResponse } from './protocol';
import { projects } from './projects';
import styles from './Playground.module.css';

interface OutputLine {
  level: ConsoleLevel | 'system';
  text: string;
}

interface PlaygroundProps {
  project: string;
}

let typesPromise: Promise<Record<string, string>> | null = null;

function loadTypes(typesUrl: string): Promise<Record<string, string>> {
  return (typesPromise ??= fetch(typesUrl).then(res => res.json()));
}

export default function Playground({ project }: PlaygroundProps): React.ReactElement {
  const definition = projects[project];

  if (!definition) {
    return <div className={styles.error}>Unknown playground project: {project}</div>;
  }

  const paths = useMemo(() => Object.keys(definition.files), [definition]);
  const modKey = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘' : 'Ctrl';
  const typesUrl = useBaseUrl('/playground/mikro-orm-types.json');

  const [files, setFiles] = useState<Record<string, string>>(() => ({ ...definition.files }));
  const [activePath, setActivePath] = useState(definition.entry);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const reset = useCallback(() => {
    setFiles({ ...definition.files });
    setActivePath(definition.entry);
    setOutput([]);
  }, [definition]);

  const run = useCallback(() => {
    workerRef.current?.terminate();
    setOutput([]);
    setRunning(true);

    const worker = new Worker(new URL('./runner.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.addEventListener('message', (event: MessageEvent<RunResponse>) => {
      const message = event.data;

      if (message.type === 'console') {
        setOutput(prev => [...prev, { level: message.level, text: message.text }]);
      } else if (message.type === 'error') {
        setOutput(prev => [...prev, { level: 'error', text: message.text }]);
        setRunning(false);
        worker.terminate();
      } else {
        setRunning(false);
        worker.terminate();
      }
    });

    const request: RunRequest = { files, entry: definition.entry };
    worker.postMessage(request);
  }, [files, definition]);

  // keep the latest run available to the Monaco keybinding without re-registering it
  const runRef = useRef(run);
  runRef.current = run;

  const configureMonaco = useCallback<BeforeMount>(
    monaco => {
      const ts = monaco.languages.typescript;
      // NodeNext + a root `type: module` marker mirrors the guide's tsconfig: top-level
      // `await` is allowed and `./foo.js` imports resolve to the sibling `.ts` files.
      ts.typescriptDefaults.setCompilerOptions({
        target: 99, // ESNext
        module: 199, // NodeNext
        moduleResolution: 99, // NodeNext
        esModuleInterop: true,
        allowNonTsExtensions: true,
        skipLibCheck: true,
        strict: true,
      });
      ts.typescriptDefaults.setEagerModelSync(true);

      void loadTypes(typesUrl).then(vfs => {
        ts.typescriptDefaults.addExtraLib('{ "type": "module" }', 'file:///package.json');
        for (const [uri, content] of Object.entries(vfs)) {
          ts.typescriptDefaults.addExtraLib(content, uri);
        }
      });

      // pre-create a model per project file so cross-file imports resolve in the editor
      for (const [path, content] of Object.entries(definition.files)) {
        const uri = monaco.Uri.parse(`file:///${path}`);
        if (!monaco.editor.getModel(uri)) {
          monaco.editor.createModel(content, 'typescript', uri);
        }
      }
    },
    [definition, typesUrl],
  );

  const handleEditorMount = useCallback<OnMount>((editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
  }, []);

  return (
    <div className={styles.playground}>
      <div className={styles.toolbar}>
        <span className={styles.activeFile}>{activePath.replace(/^src\//, '')}</span>
        <div className={styles.actions}>
          <button className={styles.run} onClick={run} disabled={running} title={`Run (${modKey} + Enter)`}>
            {running ? 'Running…' : `Run (${modKey} + Enter)`}
          </button>
          <button className={styles.secondary} onClick={reset} disabled={running}>
            Reset
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.sidebar}>
          {paths.map(path => (
            <button
              key={path}
              className={path === activePath ? styles.fileActive : styles.file}
              onClick={() => setActivePath(path)}
            >
              {path.replace(/^src\//, '')}
            </button>
          ))}
        </div>

        <div className={styles.editorPane}>
          <Editor
            height="380px"
            theme="vs-dark"
            path={`file:///${activePath}`}
            language="typescript"
            value={files[activePath]}
            beforeMount={configureMonaco}
            onMount={handleEditorMount}
            onChange={value => setFiles(prev => ({ ...prev, [activePath]: value ?? '' }))}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              fixedOverflowWidgets: true,
            }}
          />
        </div>
      </div>

      <div className={styles.output}>
        {output.length === 0 ? (
          <div className={styles.placeholder}>Press Run to execute against an in-browser SQLite database.</div>
        ) : (
          output.map((line, index) => (
            <div key={index} className={styles[line.level] ?? styles.log}>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
