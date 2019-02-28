export interface CacheAdapter {

  get(name: string): any;

  set(name: string, data: any, origin: string): void;

}
