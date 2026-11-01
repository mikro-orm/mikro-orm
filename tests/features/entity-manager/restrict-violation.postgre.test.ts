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
