import { ForeignKeyConstraintViolationException, MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Parent {
  @PrimaryKey()
  id!: number;
}

@Entity()
class Child {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent, { deleteRule: 'restrict', updateRule: 'restrict' })
  parent!: Parent;
}

describe('RESTRICT constraint violations [postgres]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Parent, Child],
      dbName: 'mikro_orm_test_restrict_violation',
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
    await orm.em.insert(Parent, { id: 1 });
    await orm.em.insert(Child, { id: 1, parent: 1 });
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  // PostgreSQL 18 reports RESTRICT violations as 23001 instead of 23503, which the CI server does not emit yet
  test.each(['23001', '23503'])('maps SQLSTATE %s to a foreign key constraint violation', code => {
    const converter = orm.em.getPlatform().getExceptionConverter();
    const error = Object.assign(
      new Error('update or delete on table "x" violates RESTRICT setting of foreign key constraint "y" on table "z"'),
      { code },
    );

    expect(converter.convertException(error)).toBeInstanceOf(ForeignKeyConstraintViolationException);
  });

  test('converts ON DELETE RESTRICT violations', async () => {
    await expect(orm.em.nativeDelete(Parent, { id: 1 })).rejects.toThrow(ForeignKeyConstraintViolationException);
    expect(await orm.em.findOneOrFail(Parent, 1)).toMatchObject({ id: 1 });
  });

  test('converts ON UPDATE RESTRICT violations', async () => {
    await expect(orm.em.nativeUpdate(Parent, { id: 1 }, { id: 2 })).rejects.toThrow(
      ForeignKeyConstraintViolationException,
    );
    expect(await orm.em.findOneOrFail(Parent, 1)).toMatchObject({ id: 1 });
  });
});
