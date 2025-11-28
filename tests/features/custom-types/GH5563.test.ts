import { MikroORM, Type, BaseEntity } from '@mikro-orm/postgresql';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
class IntervalType extends Type<number, number | null | undefined> {

  getColumnType() {
    return `interval`;
  }

  override get runtimeType(): string {
    return 'number';
  }

  compareAsType(): string {
    return 'number';
  }

  convertToJSValueSQL(key: string) {
    return `(extract (epoch from ${key}::interval) * 1000)::int`;
  }

  convertToDatabaseValueSQL(key: string) {
    return `(${key} || 'milliseconds')::interval`;
  }

}

@Entity()
class A extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property({ type: IntervalType })
  end!: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [A],
    dbName: '5563',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('update customType', async () => {
  const bk = orm.em.create(A, { end: 10 });
  await orm.em.flush();
  orm.em.clear();
  const entityA = await orm.em.findOneOrFail(A, { id: bk.id });
  entityA.assign({ end: 500 });
  await orm.em.flush();
});
