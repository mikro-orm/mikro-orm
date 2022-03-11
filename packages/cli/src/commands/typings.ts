import {Configuration, IDatabaseDriver, MikroORM} from "@mikro-orm/core";

export interface OrmProvider<T extends IDatabaseDriver = IDatabaseDriver> {
  (): Promise<MikroORM<T>>
}
export interface ConfigProvider<T extends IDatabaseDriver = IDatabaseDriver> {
  (): Promise<Configuration<T>>
}
//export type MikroOrmProvider<T extends IDatabaseDriver = IDatabaseDriver> = () => Promise<MikroORM<T>>
