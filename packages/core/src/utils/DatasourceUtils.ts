import type { EntityManager, MikroORM } from '../';

export class DatasourceUtils {

  private static ormMap?: Map<string, MikroORM>;

  static getEntityManager(name = 'default'): EntityManager | undefined {
    return this.ormMap?.get(name)?.em;
  }

  /**
   * To start first transaction using @Transactional(), need to set datasource.
   * However, this is not necessary if there is an existing RequestContext or TransactionContext.
   */
  static setDatasource(orm: MikroORM, name = 'default'): void {
    this.ormMap ||= new Map();
    this.ormMap.set(name, orm);
  }

  static clear() {
    this.ormMap?.clear();
  }

}
