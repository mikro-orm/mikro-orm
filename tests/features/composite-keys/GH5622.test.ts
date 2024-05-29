import { Entity, PrimaryKey, ManyToOne, SimpleLogger, PrimaryKeyProp, BaseEntity } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Tenant extends BaseEntity {

  @PrimaryKey()
  id!: string;

}

@Entity()
class Something extends BaseEntity {

  [PrimaryKeyProp]?: ['tenant', 'id'];

  @ManyToOne(() => Tenant, { fieldName: 'tenant_id', primary: true })
  tenant!: Tenant;

  @PrimaryKey()
  id!: string;

}

@Entity()
class SomethingThatBelongsToSomething extends BaseEntity {

  [PrimaryKeyProp]?: ['tenant', 'something', 'id'];

  @ManyToOne(() => Tenant, { fieldName: 'tenant_id', primary: true })
  tenant!: Tenant;

  @ManyToOne(() => Something, {
    fieldName: 'something_id',
    joinColumns: ['tenant_id', 'something_id'],
    referencedColumnNames: ['tenant_id', 'id'],
    primary: true,
  })
  something!: Something;

  @PrimaryKey()
  id!: string;

}

@Entity()
class SomethingThatBelongsToSomethingThatBelongsToSomething extends BaseEntity {

  [PrimaryKeyProp]?: ['tenant', 'something', 'somethingThatBelongsToSomething'];

  @ManyToOne(() => Tenant, { fieldName: 'tenant_id', primary: true })
  tenant!: Tenant;

  @ManyToOne(() => Something, {
    fieldName: 'something_id',
    joinColumns: ['tenant_id', 'something_id'],
    referencedColumnNames: ['tenant_id', 'id'],
    primary: true,
  })
  something!: Something;

  @ManyToOne(() => SomethingThatBelongsToSomething, {
    fieldName: 'something_that_belongs_to_something_id',
    joinColumns: ['tenant_id', 'something_id', 'something_that_belongs_to_something_id'],
    referencedColumnNames: ['tenant_id', 'something_id', 'id'],
    primary: true,
  })
  somethingThatBelongsToSomething!: SomethingThatBelongsToSomething;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [SomethingThatBelongsToSomethingThatBelongsToSomething],
    dbName: `:memory:`,
    loggerFactory: options => new SimpleLogger(options),
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test(`GH issue 5622`, async () => {
  expect(await orm.schema.getCreateSchemaSQL()).toMatchSnapshot();

  const tenant = orm.em.create(Tenant, { id: '1' });
  const something = orm.em.create(Something, { tenant, id: '2' });
  const somethingThatBelongsToSomething = orm.em.create(SomethingThatBelongsToSomething, { tenant, something, id: '3' });
  orm.em.create(SomethingThatBelongsToSomethingThatBelongsToSomething, { tenant, something, somethingThatBelongsToSomething });


  await expect(orm.em.flush()).resolves.not.toThrow();
});
