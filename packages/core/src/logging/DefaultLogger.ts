import type { Logger, LoggerNamespace, LogContext, LoggerOptions } from './Logger';
import { Utils } from '../utils/Utils';
import { colors } from './colors';

export class DefaultLogger implements Logger {

  public debugMode = this.options.debugMode ?? false;
  private readonly usesReplicas = this.options.usesReplicas;
  private readonly highlighter = this.options.highlighter;
  private readonly writer = this.options.writer;

  constructor(private readonly options: LoggerOptions) {}

  /**
   * @inheritDoc
   */
  log(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    if (!this.isEnabled(namespace)) {
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

    this.writer(colors.grey(`[${namespace}] `) + message);
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

  isEnabled(namespace: LoggerNamespace): boolean {
    return !!this.debugMode && (!Array.isArray(this.debugMode) || this.debugMode.includes(namespace));
  }

  /**
   * @inheritDoc
   */
  logQuery(context: { query: string } & LogContext): void {
    if (!this.isEnabled('query')) {
      return;
    }

    /* istanbul ignore next */
    const query = this.highlighter?.highlight(context.query) ?? context.query;
    let msg = query + (Utils.isDefined(context.took) ? colors.grey(` [took ${context.took} ms]`) : '');

    if (this.usesReplicas && context.connection) {
      msg += colors.cyan(` (via ${context.connection.type} connection '${context.connection.name}')`);
    }

    return this.log('query', msg, context);
  }

}
