import type { Dictionary, Highlighter } from '../typings';

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

  isEnabled(namespace: LoggerNamespace, context?: LogContext): boolean;

}

export type LoggerNamespace = 'query' | 'query-params' | 'schema' | 'discovery' | 'info';

export interface LogContext extends Dictionary {
  query?: string;
  label?: string;
  params?: unknown[];
  took?: number;
  results?: number;
  affected?: number;
  level?: 'info' | 'warning' | 'error';
  enabled?: boolean;
  debugMode?: LoggerNamespace[];
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

/**
 * Logger options to modify format output and overrides, including a label and additional properties that can be accessed by custom loggers
 *
 * Differs from {@link LoggerOptions} in terms of how they are used; this type is primarily a public type meant to be used within methods like `EntityManager.Find`
 *
 * @example
 * await em.findOne(User, 1, { loggerContext: { label: 'user middleware' } };
 * // [query] (user middleware) select * from user where id = 1;
 */
export type LoggingOptions = Pick<LogContext, 'label' | 'enabled' | 'debugMode'> & Dictionary;
