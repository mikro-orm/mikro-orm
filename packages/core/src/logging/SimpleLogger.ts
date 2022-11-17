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
	logQuery(context: { query: string } & LogContext): void {
		if (!this.isEnabled('query')) {
			return;
		}

		return this.log('query', context.query, context);
	}
}
