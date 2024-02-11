import {
  Entity,
  Ref,
  LoadStrategy,
  ManyToOne,
  MikroORM,
  PrimaryKey,
  Property,
  wrap,
} from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property()
  description!: string;

  @ManyToOne(() => B, { ref: true })
  b!: Ref<B>;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [A, B],
  });
  await orm.schema.createSchema();

  const b1 = orm.em.create(B, { name: 'b1' }, { persist: false });
  const b2 = orm.em.create(B, { name: 'b2' }, { persist: false });
  await orm.em.insertMany([b1, b2]);
  await orm.em.insertMany(A, [
    { b: b1.id, description: 'd1' },
    { b: b2.id, description: 'd2' },
  ]);
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 4433 (select-in)`, async () => {
  const result = await orm.em.fork().find(
    A,
    {},
    {
      fields: ['b.*'],
      strategy: LoadStrategy.SELECT_IN,
    },
  );
  expect(result.map(r => wrap(r).toObject())).toEqual([
    {
      b: { id: 1, name: 'b1' },
      id: 1,
    },
    {
      b: { id: 2, name: 'b2' },
      id: 2,
    },
  ]);
});

test(`GH issue 4433 (select-in) - *`, async () => {
  const result = await orm.em.fork().find(
    A,
    {},
    {
      fields: ['*', 'b.*'],
      strategy: LoadStrategy.SELECT_IN,
    },
  );
  expect(result.map(r => wrap(r).toObject())).toEqual([
    {
      b: { id: 1, name: 'b1' }, // but it's not in the serialized form, this fails
      id: 1,
      description: 'd1',
    },
    {
      b: { id: 2, name: 'b2' },
      id: 2,
      description: 'd2',
    },
  ]);
});

test(`GH issue 4433 (select-in) - populate + field`, async () => {
  const result = await orm.em.fork().find(
    A,
    {},
    {
      populate: ['b'],
      fields: ['*'],
      strategy: LoadStrategy.SELECT_IN,
    },
  );
  expect(result.map(r => wrap(r).toObject())).toEqual([
    {
      b: { id: 1, name: 'b1' }, // but it's not in the serialized form, this fails
      id: 1,
      description: 'd1',
    },
    {
      b: { id: 2, name: 'b2' },
      id: 2,
      description: 'd2',
    },
  ]);
});

test(`GH issue 4433 (select-in) - only id`, async () => {
  const result = await orm.em.fork().find(
    A,
    { },
    {
      populate: ['*'],
      fields: ['*', 'b.id'],
      strategy: LoadStrategy.SELECT_IN,
    },
  );
  expect(result.map(r => wrap(r).toObject())).toEqual([
    {
      b: { id: 1 },
      id: 1,
      description: 'd1',
    },
    {
      b: { id: 2 },
      id: 2,
      description: 'd2',
    },
  ]);
});
