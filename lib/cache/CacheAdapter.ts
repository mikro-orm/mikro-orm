export interface CacheAdapter {

  get(name: string, origin: string): any;

  set(name: string, metadata: any, origin: string): void;

}
