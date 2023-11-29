import type { LogContext, LoggerNamespace } from './Logger';
import { DefaultLogger } from './DefaultLogger';

/**
 * A basic logger that provides fully formatted output without color
 */
export class SimpleLogger extends DefaultLogger {

  /**
   * @inheritDoc
   */
  override log(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    if (!this.isEnabled(namespace, context)) {
      return;
    }

    // clean up the whitespace
    message = message.replace(/\n/g, '').replace(/ +/g, ' ').trim();
    const label = context?.label ? `(${context.label}) ` : '';

    this.writer(`[${namespace}] ${label}${message}`);
  }

  /**
   * @inheritDoc
   */
  override logQuery(context: { query: string } & LogContext): void {
    if (!this.isEnabled('query', context)) {
      return;
    }

    return this.log('query', context.query, context);
  }

}
