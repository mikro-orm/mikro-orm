export class Logger {

  constructor(private readonly logger: (message: string) => void,
              private debugMode = false) { }

  info(message: string): void {
    this.logger(message);
  }

  debug(message: string): void {
    if (this.debugMode) {
      this.logger(message);
    }
  }

  setDebugMode(debugMode: boolean): void {
    this.debugMode = debugMode;
  }

}
