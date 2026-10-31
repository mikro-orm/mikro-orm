import { MikroORM } from '@mikro-orm/pglite';
import {
  Embeddable,
  Embedded,
  Entity,
  Index,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class Address {
  @Property({ type: 'string' })
  zipCode!: string;
}

@Embeddable()
class Settings {
  @Property({ type: 'string' })
  displayName!: string;

  @Embedded(() => Address, { object: true })
  address!: Address;

  @Property({ type: 'json', nullable: true })
  meta?: { someKey: string };
}

@Entity()
@Index({ name: 'user_display_name_idx', properties: ['settings.displayName'] })
@Index({ name: 'user_zip_code_idx', properties: ['settings.address.zipCode'] })
@Index({ name: 'user_meta_key_idx', properties: ['settings.meta.someKey'] })
class User {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Embedded(() => Settings, { object: true })
  settings!: Settings;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'memory://',
    entities: [User],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #8486: index on an object embeddable property uses the persisted JSON keys', async () => {
  orm.em.create(User, {
    id: 1,
    settings: { displayName: 'foo', address: { zipCode: '123' }, meta: { someKey: 'k' } },
  });
  await orm.em.flush();
  orm.em.clear();

  const [row] = await orm.em.execute('select settings from "user"');
  expect(row.settings).toEqual({ display_name: 'foo', address: { zip_code: '123' }, meta: { someKey: 'k' } });

  const qb = orm.em.createQueryBuilder(User).where({ settings: { displayName: 'foo' } });
  expect(qb.getFormattedQuery()).toContain(`"settings"->>'display_name' = 'foo'`);

  const indexes = await orm.em.execute<{ indexdef: string }[]>(
    `select indexdef from pg_indexes where tablename = 'user' and indexname like 'user_%_idx' order by indexname`,
  );
  expect(indexes.map(i => i.indexdef)).toEqual([
    `CREATE INDEX user_display_name_idx ON public."user" USING btree (((settings ->> 'display_name'::text)))`,
    `CREATE INDEX user_meta_key_idx ON public."user" USING btree ((((settings -> 'meta'::text) ->> 'someKey'::text)))`,
    `CREATE INDEX user_zip_code_idx ON public."user" USING btree ((((settings -> 'address'::text) ->> 'zip_code'::text)))`,
  ]);

  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});
