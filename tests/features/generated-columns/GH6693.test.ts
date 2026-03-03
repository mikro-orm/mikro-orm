import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class UserNumber {
  @PrimaryKey({ generated: 'identity' })
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;
}

@Entity()
class UserBigInt {
  @PrimaryKey({ generated: 'identity' })
  id!: bigint;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6693',
    entities: [UserNumber, UserBigInt],
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('id as number/bigint primary key with generated identity', async () => {
  const schemaDump = await orm.schema.getCreateSchemaSQL();

  expect(schemaDump).toContain(
    'create table "user_number" ("id" int generated always as identity not null primary key',
  );
  expect(schemaDump).toContain(
    'create table "user_big_int" ("id" bigint generated always as identity not null primary key',
  );
});
