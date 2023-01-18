import {
  Entity,
  PrimaryKey,
  Property,
  MikroORM,
  UnderscoreNamingStrategy,
} from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MySqlDriver } from '@mikro-orm/mysql';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property()
  prop?: string;

}

describe('GH issue 2930', () => {

  describe('postgresql (PK override)', () => {
    let orm: MikroORM<PostgreSqlDriver>;

    beforeAll(async () => {
      orm = await MikroORM.init({
        entities: [A],
        dbName: 'mikro_orm_test_gh2930',
        driver: PostgreSqlDriver,
        namingStrategy: class extends UnderscoreNamingStrategy {

          indexName(tableName: string, columns: string[], type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence' | 'check'): string {
            if (type === 'primary') {
              return `pk_${tableName}_${columns.join('_')}`;
            }
            return super.indexName(tableName, columns, type);
          }

        },
      });
    });

    afterAll(() => orm.close(true));

    test(`should not ignore custom pk name`, async () => {
      const sql = await orm.schema.getCreateSchemaSQL();
      expect(sql).toMatchSnapshot();
    });
  });

  describe('postgresql (PK not override)', () => {
    let orm: MikroORM<PostgreSqlDriver>;

    beforeAll(async () => {
      orm = await MikroORM.init({
        entities: [A],
        dbName: 'mikro_orm_test_gh2930',
        driver: PostgreSqlDriver,
        namingStrategy: class extends UnderscoreNamingStrategy {

          indexName(tableName: string, columns: string[], type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence' | 'check'): string {
            return super.indexName(tableName, columns, type);
          }

        },
      });
    });

    afterAll(() => orm.close(true));

    test(`should not generate a sql naming PK`, async () => {
      const sql = await orm.schema.getCreateSchemaSQL();
      expect(sql).toMatchSnapshot();
    });
  });

  describe('mysql', () => {
    let orm: MikroORM<MySqlDriver>;

    beforeAll(async () => {
      orm = await MikroORM.init({
        entities: [A],
        dbName: 'mikro_orm_test_gh2930',
        driver: MySqlDriver,
        port: 3308,
        namingStrategy: class extends UnderscoreNamingStrategy {

          indexName(tableName: string, columns: string[], type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence' | 'check'): string {
            if (type === 'primary') {
              return `pk_${tableName}_${columns.join('_')}`;
            }
            return super.indexName(tableName, columns, type);
          }

        },
      });
    });

    afterAll(() => orm.close(true));

    test(`should ignore custom pk name`, async () => {
      const sql = await orm.schema.getCreateSchemaSQL();
      expect(sql).toMatchSnapshot();
    });
  });
});
