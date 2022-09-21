import type { LogContext, LoggerNamespace } from './Logger';
import { DefaultLogger } from './DefaultLogger';

export class SimpleLogger extends DefaultLogger {

  /**
   * @inheritDoc
   */
  log(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    if (!this.isEnabled(namespace)) {
      return;
    }

    // clean up the whitespace
    message = message.replace(/\n/g, '').replace(/ +/g, ' ').trim();

    this.writer(`[${namespace}] ${message}`);
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

    return this.log('query', context.query, context);
  }

}
