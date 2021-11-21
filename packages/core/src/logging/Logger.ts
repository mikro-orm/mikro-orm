import type { Highlighter } from '../typings';

export interface Logger {

  /**
   * Logs a message inside given namespace.
   */
  log(namespace: LoggerNamespace, message: string, context?: LogContext): void;

  /**
   * Logs error message inside given namespace.
   */
  error(namespace: LoggerNamespace, message: string, context?: LogContext): void;

  /**
   * Logs warning message inside given namespace.
   */
  warn(namespace: LoggerNamespace, message: string, context?: LogContext): void;

  /**
   * Logs a message inside given namespace.
   */
  logQuery(context: LogContext): void;

  /**
   * Sets active namespaces. Pass `true` to enable all logging.
   */
  setDebugMode(debugMode: boolean | LoggerNamespace[]): void;

  isEnabled(namespace: LoggerNamespace): boolean;

}

export type LoggerNamespace = 'query' | 'query-params' | 'discovery' | 'info';

export interface LogContext {
  query?: string;
  params?: unknown[];
  took?: number;
  level?: 'info' | 'warning' | 'error';
  connection?: {
    type?: string;
    name?: string;
  };
}

export interface LoggerOptions {
  writer: (message: string) => void;
  debugMode?: boolean | LoggerNamespace[];
  highlighter?: Highlighter;
  usesReplicas?: boolean;
}
