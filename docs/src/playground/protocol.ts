export interface RunRequest {
  files: Record<string, string>;
  entry: string;
}

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export type RunResponse =
  | { type: 'console'; level: ConsoleLevel; text: string }
  | { type: 'done' }
  | { type: 'error'; text: string };
