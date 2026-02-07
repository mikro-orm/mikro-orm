import { Collection, Ref, MikroORM, Reference, SimpleLogger } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class Customer {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany({ entity: () => License, mappedBy: 'customer' })
  licenses = new Collection<License>(this);

}

@Entity()
class License {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Customer, ref: true })
  customer: Ref<Customer>;

  constructor(customer: Customer | Ref<Customer>) {
    this.customer = Reference.create(customer);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Customer, License],
    dbName: '6405',
    loggerFactory: SimpleLogger.create,
    schema: 'myschema',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('6405', async () => {
  const mock = mockLogger(orm);
  await orm.schema.clear({ truncate: false });
  expect(mock.mock.calls).toEqual([
    ['[query] delete from "myschema"."license"'],
    ['[query] delete from "myschema"."customer"'],
  ]);
  mock.mockReset();
  await orm.schema.clear();
  expect(mock.mock.calls).toEqual([
    ['[query] truncate table "myschema"."license" restart identity cascade'],
    ['[query] truncate table "myschema"."customer" restart identity cascade'],
  ]);
  mock.mockReset();
  await orm.schema.clear({ schema: 'myschema' });
  expect(mock.mock.calls).toEqual([
    ['[query] truncate table "myschema"."license" restart identity cascade'],
    ['[query] truncate table "myschema"."customer" restart identity cascade'],
  ]);
  mock.mockReset();
  await orm.schema.drop();
  expect(mock).toHaveBeenCalledWith('[query] drop table if exists "myschema"."license" cascade;drop table if exists "myschema"."customer" cascade;');
  mock.mockReset();
  await orm.schema.drop({ schema: 'myschema' });
  expect(mock).toHaveBeenCalledWith('[query] drop table if exists "myschema"."license" cascade;drop table if exists "myschema"."customer" cascade;');
  mock.mockReset();
});
