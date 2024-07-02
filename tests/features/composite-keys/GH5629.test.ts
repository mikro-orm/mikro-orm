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
    joinColumns: ['tenant_id', 'something_id'],
    referencedColumnNames: ['tenant_id', 'id'],
    primary: true,
  })
  something!: Something;

  @PrimaryKey()
  id!: string;

}

@Entity()
class SomethingThatBelongsX2 extends BaseEntity {

  [PrimaryKeyProp]?: ['tenant', 'something', 'x1', 'id'];

  @ManyToOne(() => Tenant, { fieldName: 'tenant_id', primary: true })
  tenant!: Tenant;

  @ManyToOne(() => Something, {
    joinColumns: ['tenant_id', 'something_id'],
    referencedColumnNames: ['tenant_id', 'id'],
    primary: true,
  })
  something!: Something;

  @ManyToOne(() => SomethingThatBelongsToSomething, {
    joinColumns: ['tenant_id', 'something_id', 'x1_id'],
    referencedColumnNames: ['tenant_id', 'something_id', 'id'],
    primary: true,
  })
  x1!: SomethingThatBelongsToSomething;

  @PrimaryKey()
  id!: string;

}

@Entity()
class SomethingThatBelongsX3 extends BaseEntity {

  [PrimaryKeyProp]?: ['tenant', 'something', 'x1', 'x2', 'id'];

  @ManyToOne(() => Tenant, { fieldName: 'tenant_id', primary: true })
  tenant!: Tenant;

  @ManyToOne(() => Something, {
    joinColumns: ['tenant_id', 'something_id'],
    referencedColumnNames: ['tenant_id', 'id'],
    primary: true,
  })
  something!: Something;

  @ManyToOne(() => SomethingThatBelongsToSomething, {
    joinColumns: ['tenant_id', 'something_id', 'x1_id'],
    referencedColumnNames: ['tenant_id', 'something_id', 'id'],
    primary: true,
  })
  x1!: SomethingThatBelongsToSomething;

  @ManyToOne(() => SomethingThatBelongsX2, {
    joinColumns: ['tenant_id', 'something_id', 'x1_id', 'x2_id'],
    referencedColumnNames: ['tenant_id', 'something_id', 'x1_id', 'id'],
    primary: true,
  })
  x2!: SomethingThatBelongsX2;

  @PrimaryKey()
  id!: string;

}

@Entity()
class SomethingThatBelongsX4 extends BaseEntity {

  [PrimaryKeyProp]?: ['tenant', 'something', 'x1', 'x2', 'x3'];

  @ManyToOne(() => Tenant, { fieldName: 'tenant_id', primary: true })
  tenant!: Tenant;

  @ManyToOne(() => Something, {
    joinColumns: ['tenant_id', 'something_id'],
    referencedColumnNames: ['tenant_id', 'id'],
    primary: true,
  })
  something!: Something;

  @ManyToOne(() => SomethingThatBelongsToSomething, {
    joinColumns: ['tenant_id', 'something_id', 'x1_id'],
    referencedColumnNames: ['tenant_id', 'something_id', 'id'],
    primary: true,
  })
  x1!: SomethingThatBelongsToSomething;

  @ManyToOne(() => SomethingThatBelongsX2, {
    joinColumns: ['tenant_id', 'something_id', 'x1_id', 'x2_id'],
    referencedColumnNames: ['tenant_id', 'something_id', 'x1_id', 'id'],
    primary: true,
  })
  x2!: SomethingThatBelongsX2;

  @ManyToOne(() => SomethingThatBelongsX3, {
    joinColumns: ['tenant_id', 'something_id', 'x1_id', 'x2_id', 'x3_id'],
    referencedColumnNames: ['tenant_id', 'something_id', 'x1_id', 'x2_id', 'id'],
    primary: true,
  })
  x3!: SomethingThatBelongsX3;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [SomethingThatBelongsX4],
    dbName: `:memory:`,
    loggerFactory: options => new SimpleLogger(options),
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test(`GH issue 5629`, async () => {
  expect(await orm.schema.getCreateSchemaSQL()).toMatchSnapshot();

  const tenant = orm.em.create(Tenant, { id: '1' });
  const something = orm.em.create(Something, { tenant, id: '2' });
  const x1 = orm.em.create(SomethingThatBelongsToSomething, { tenant, something, id: '3' });
  const x2 = orm.em.create(SomethingThatBelongsX2, { tenant, something, x1, id: '4' });
  const x3 = orm.em.create(SomethingThatBelongsX3, { tenant, something, x1, x2, id: '5' });
  orm.em.create(SomethingThatBelongsX4, { tenant, something, x1, x2, x3 });

  await orm.em.flush();

  const resolved = (await orm.em.findOne(SomethingThatBelongsX4, {
    tenant: { id: '1' },
    something: { id: '2' },
    x1: { id: '3' },
    x2: { id: '4' },
    x3: { id: '5' },
  }))!;

  expect(resolved).toMatchObject({
    tenant,
    something,
    x1,
    x2,
    x3,
  });
});


test('GH issue 5629, createCompositeKeyArray', async () => {
  const metadata = orm.getMetadata().get(SomethingThatBelongsX4);

  const compositeKeys = metadata.props.map(p => ({
    fieldNames: p.fieldNames,
    compositeKey: orm.em.getComparator().createCompositeKeyArray(p),
  }));
  expect(compositeKeys).toMatchSnapshot();
});

test.failing(`GH issue 5629, query fields`, async () => {
  const tenant = orm.em.create(Tenant, { id: '2' });
  const something = orm.em.create(Something, { tenant, id: '3' });
  const x1 = orm.em.create(SomethingThatBelongsToSomething, { tenant, something, id: '4' });
  const x2 = orm.em.create(SomethingThatBelongsX2, { tenant, something, x1, id: '5' });
  const x3 = orm.em.create(SomethingThatBelongsX3, { tenant, something, x1, x2, id: '6' });
  orm.em.create(SomethingThatBelongsX4, { tenant, something, x1, x2, x3 });

  await orm.em.flush();

  const resolved = (await orm.em.findOne(SomethingThatBelongsX4, {
    tenant,
    something,
    x1,
    x2,
    x3,
  }))!;

  expect(resolved).toMatchObject({
    tenant,
    something,
    x1,
    x2,
    x3,
  });
});
