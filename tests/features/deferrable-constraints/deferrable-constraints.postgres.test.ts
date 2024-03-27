import { DeferMode, Entity, ManyToOne, PrimaryKey, MikroORM, Ref, Reference } from '@mikro-orm/postgresql';

@Entity()
class Parent {

  @PrimaryKey()
  id!: number;

}

@Entity()
class Child {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent, { ref: true, deferMode: DeferMode.INITIALLY_DEFERRED })
  parent!: Ref<Parent>;

}

describe('deferrable constraints in postgres', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Parent, Child],
      dbName: `mikro_orm_test_deferrable`,
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
  });
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('insert deferred', async () => {
    await orm.em.transactional(async em => {
      const parent = new Parent();
      parent.id = 1;
      const child = new Child();
      child.id = 1;
      child.parent = Reference.createFromPK(Parent, 1);

      await em.persistAndFlush(child);
      await em.persistAndFlush(parent);
    });
  });

});
