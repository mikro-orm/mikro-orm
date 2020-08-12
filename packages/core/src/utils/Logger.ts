import c from 'ansi-colors';

export class Logger {

  constructor(private readonly logger: (message: string) => void,
              public debugMode: boolean | LoggerNamespace[] = false) { }

  /**
   * Logs a message inside given namespace.
   */
  log(namespace: LoggerNamespace, message: string): void {
    if (!this.isEnabled(namespace)) {
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

  isEnabled(namespace: LoggerNamespace): boolean {
    return this.debugMode && (!Array.isArray(this.debugMode) || this.debugMode.includes(namespace));
  }

}

export type LoggerNamespace = 'query' | 'query-params' | 'discovery' | 'info';
