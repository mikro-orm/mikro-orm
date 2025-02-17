import type { AnyString, Dictionary, Highlighter } from '../typings.js';

export interface Logger {

  /**
   * Logs a message inside given namespace.
   */
  log(namespace: LoggerNamespace | AnyString, message: string, context?: LogContext): void;

  /**
   * Logs error message inside given namespace.
   */
  error(namespace: LoggerNamespace | AnyString, message: string, context?: LogContext): void;

  /**
   * Logs warning message inside given namespace.
   */
  warn(namespace: LoggerNamespace | AnyString, message: string, context?: LogContext): void;

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

export type LoggerNamespace = 'query' | 'query-params' | 'schema' | 'discovery' | 'info' | 'deprecated';

export interface LogContext extends Dictionary {
  query?: string;
  label?: string;
  params?: readonly unknown[];
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
  ignoreDeprecations?: boolean | string[];
  highlighter?: Highlighter;
  usesReplicas?: boolean;
}

/**
 * Logger options to modify format output and overrides, including a label and additional properties that can be accessed by custom loggers.
 *
 * Differs from {@apilink LoggerOptions} in terms of how they are used; this type is primarily a public type meant to be used within methods like `em.find()`.
 *
 * @example
 * await em.findOne(User, 1, { logger: { label: 'user middleware' } };
 * // [query] (user middleware) select * from user where id = 1;
 */
export type LoggingOptions = Pick<LogContext, 'label' | 'enabled' | 'debugMode'>;
