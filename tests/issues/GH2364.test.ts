import {
  BigIntType,
  Entity, Enum,
  IdentifiedReference,
  ManyToOne,
  MikroORM,
  PrimaryKey, QueryOrder,
} from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

export enum EntityType {
  TYPE_1 = 'type_1',
  TYPE_2 = 'type_2'
}


@Entity({ discriminatorColumn: 'type', abstract: true })
abstract class BaseEntity {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @ManyToOne(() => BaseEntity, { wrappedReference: true, nullable: true })
  parent?: IdentifiedReference<BaseEntity>;

  @Enum({ type: () => EntityType })
  type!: EntityType;

}

@Entity({ discriminatorValue: EntityType.TYPE_1 })
export class Type1Entity extends BaseEntity {

}

@Entity({ discriminatorValue: EntityType.TYPE_2 })
export class Type2Entity extends BaseEntity {

}

describe('GH issue 2364', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [BaseEntity, Type1Entity, Type2Entity],
      dbName: 'mikro_orm_test_2364',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('should return an instance of subclass for both instance', async () => {
    const fork1 = orm.em.fork({ clear: true });

    const parent = new Type1Entity();

    fork1.persist(parent);

    const second = new Type2Entity();

    fork1.assign(second, { parent });

    fork1.persist(second);

    await fork1.flush();

    fork1.clear();

    const asc = await orm.em.fork({ clear:true }).find(BaseEntity, {}, { orderBy: { id: QueryOrder.ASC } });

    expect(asc).toHaveLength(2);
    expect(asc[0]).toBeInstanceOf(Type1Entity);
    expect(asc[1]).toBeInstanceOf(Type2Entity);

    const desc = await orm.em.fork({ clear:true }).find(BaseEntity, {}, { orderBy: { id: QueryOrder.DESC } });

    expect(desc).toHaveLength(2);
    expect(desc[0]).toBeInstanceOf(Type2Entity);
    expect(desc[1]).toBeInstanceOf(Type1Entity);
  });

});
