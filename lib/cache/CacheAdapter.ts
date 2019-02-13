export interface CacheAdapter {

  get(name: string, origin: string): any;

  set(name: string, data: any, origin: string): void;

}
