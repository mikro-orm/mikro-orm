import c from 'ansi-colors';

export class Logger {

  constructor(private readonly logger: (message: string) => void,
              public debugMode: boolean | LoggerNamespace[] = false) { }

  /**
   * Logs a message inside given namespace.
   */
  log(namespace: LoggerNamespace, message: string): void {
    if (!this.debugMode) {
      return;
    }

    if (Array.isArray(this.debugMode) && !this.debugMode.includes(namespace)) {
      return;
    }

    // clean up the whitespace
    message = message.replace(/\n/g, '').replace(/ +/g, ' ').trim();
    this.logger(c.grey(`[${namespace}] `) + message);
  }

  /**
   * Sets active namespaces. Pass `true` to enable all logging.
   */
  setDebugMode(debugMode: boolean | LoggerNamespace[]): void {
    this.debugMode = debugMode;
  }

}

export type LoggerNamespace = 'query' | 'query-params' | 'discovery' | 'info';
