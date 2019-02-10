import { IPrimaryKey } from '..';
import { ReferenceType } from '../decorators/Entity';
import { DatabaseDriver } from './DatabaseDriver';
import { QueryBuilder } from '../QueryBuilder';
import { Connection } from '../connections/Connection';

export abstract class AbstractSqlDriver<C extends Connection> extends DatabaseDriver<C> {

  protected createQueryBuilder(entityName: string): QueryBuilder {
    return new QueryBuilder(entityName, this.metadata, this.connection);
  }

  protected extractManyToMany(entityName: string, data: any): any {
    if (!this.metadata[entityName]) {
      return {};
    }

    const props = this.metadata[entityName].properties;
    const ret = {} as any;

    for (const k of Object.keys(data)) {
      const prop = props[k];

      if (prop && prop.reference === ReferenceType.MANY_TO_MANY) {
        ret[k] = data[k];
        delete data[k];
      }
    }

    return ret;
  }

  protected async processManyToMany(entityName: string, pk: IPrimaryKey, collections: any) {
    const props = this.metadata[entityName].properties;

    for (const k of Object.keys(collections)) {
      const prop = props[k];
      const fk1 = prop.joinColumn;

      if (prop.owner) {
        const qb1 = this.createQueryBuilder(prop.pivotTable);
        const fk2 = prop.inverseJoinColumn;
        await qb1.delete({ [fk1]: pk }).execute();

        for (const item of collections[k]) {
          const qb2 = this.createQueryBuilder(prop.pivotTable);
          await qb2.insert({ [fk1]: pk, [fk2]: item }).execute();
        }
      }
    }
  }

}
