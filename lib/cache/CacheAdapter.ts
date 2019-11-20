export interface CacheAdapter {

  get(name: string): Promise<any>;

  set(name: string, data: any, origin: string): Promise<void>;

  clear(): Promise<void>;

}
