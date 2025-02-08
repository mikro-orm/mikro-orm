import {
  Collection,
  Entity,
  Ref,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Reference,
  Property,
  SimpleLogger,
} from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers';

@Entity()
class Customer {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany({ entity: 'License', mappedBy: 'customer' })
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
    entities: [Customer, License],
    dbName: '6405',
    loggerFactory: SimpleLogger.create,
    schema: 'myschema',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('6405', async () => {
  const mock = mockLogger(orm);
  await orm.schema.clearDatabase({ truncate: false });
  expect(mock.mock.calls).toEqual([
    ['[query] delete from "myschema"."license"'],
    ['[query] delete from "myschema"."customer"'],
  ]);
  mock.mockReset();
  await orm.schema.clearDatabase();
  expect(mock.mock.calls).toEqual([
    ['[query] set session_replication_role = \'replica\';'],
    ['[query] truncate table "myschema"."license" restart identity cascade'],
    ['[query] truncate table "myschema"."customer" restart identity cascade'],
    ['[query] set session_replication_role = \'origin\';'],
  ]);
  mock.mockReset();
  await orm.schema.clearDatabase({ schema: 'myschema' });
  expect(mock.mock.calls).toEqual([
    ['[query] set session_replication_role = \'replica\';'],
    ['[query] truncate table "myschema"."license" restart identity cascade'],
    ['[query] truncate table "myschema"."customer" restart identity cascade'],
    ['[query] set session_replication_role = \'origin\';'],
  ]);
  mock.mockReset();
  await orm.schema.dropSchema();
  expect(mock).toHaveBeenCalledWith('[query] drop table if exists "myschema"."license" cascade;drop table if exists "myschema"."customer" cascade;');
  mock.mockReset();
  await orm.schema.dropSchema({ schema: 'myschema' });
  expect(mock).toHaveBeenCalledWith('[query] drop table if exists "myschema"."license" cascade;drop table if exists "myschema"."customer" cascade;');
  mock.mockReset();
});
