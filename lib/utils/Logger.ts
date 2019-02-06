import { MikroORMOptions } from '../MikroORM';

export class Logger {

  constructor(private readonly options: MikroORMOptions) { }

  info(message: string): void {
    this.options.logger(message);
  }

  debug(message: string): void {
    if (this.options.debug) {
      this.options.logger(message);
    }
  }

}
