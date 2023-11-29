import type { Logger, LoggerNamespace, LogContext, LoggerOptions } from './Logger';
import { colors } from './colors';
import type { Highlighter } from '../typings';

export class DefaultLogger implements Logger {

  debugMode: boolean | LoggerNamespace[];
  readonly writer: (message: string) => void;
  private readonly usesReplicas?: boolean;
  private readonly highlighter?: Highlighter;

  constructor(private readonly options: LoggerOptions) {
    this.debugMode = this.options.debugMode ?? false;
    this.writer = this.options.writer;
    this.usesReplicas = this.options.usesReplicas;
    this.highlighter = this.options.highlighter;
  }

  /**
   * @inheritDoc
   */
  log(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    if (!this.isEnabled(namespace, context)) {
      return;
    }

    // clean up the whitespace
    message = message.replace(/\n/g, '').replace(/ +/g, ' ').trim();

    // use red for error levels
    if (context?.level === 'error') {
      message = colors.red(message);
    }

    // use yellow for warning levels
    if (context?.level === 'warning') {
      message = colors.yellow(message);
    }

    const label = context?.label
      ? colors.cyan(`(${context.label}) `)
      : '';

    this.writer(colors.grey(`[${namespace}] `) + label + message);
  }

  /**
   * @inheritDoc
   */
  error(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    this.log(namespace, message, { ...context, level: 'error' });
  }

  /**
   * @inheritDoc
   */
  warn(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    this.log(namespace, message, { ...context, level: 'warning' });
  }

  /**
   * @inheritDoc
   */
  setDebugMode(debugMode: boolean | LoggerNamespace[]): void {
    this.debugMode = debugMode;
  }

  isEnabled(namespace: LoggerNamespace, context?: LogContext) {
    if (context?.enabled !== undefined) { return context.enabled; }
    const debugMode = context?.debugMode ?? this.debugMode;

    return !!debugMode && (!Array.isArray(debugMode) || debugMode.includes(namespace));
  }

  /**
   * @inheritDoc
   */
  logQuery(context: { query: string } & LogContext): void {
    if (!this.isEnabled('query', context)) {
      return;
    }

    /* istanbul ignore next */
    let msg = this.highlighter?.highlight(context.query) ?? context.query;

    if (context.took != null) {
      const meta = [`took ${context.took} ms`];

      if (context.results != null) {
        meta.push(`${context.results} result${context.results === 0 || context.results > 1 ? 's' : ''}`);
      }

      if (context.affected != null) {
        meta.push(`${context.affected} row${context.affected === 0 || context.affected > 1 ? 's' : ''} affected`);
      }

      msg += colors.grey(` [${meta.join(', ')}]`);
    }

    if (this.usesReplicas && context.connection) {
      msg += colors.cyan(` (via ${context.connection.type} connection '${context.connection.name}')`);
    }

    return this.log('query', msg, context);
  }

}
