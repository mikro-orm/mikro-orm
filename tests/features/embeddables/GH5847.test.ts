import { MikroORM } from '@mikro-orm/sqlite';
import { Embeddable, Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Embeddable()
class EmbeddableEntity {

  @Property()
  active = false;

  @Property({ type: 'json' })
  email: Record<string, string> = { a: 'a', b: 'b' };

  @Property()
  subject = 'Here is your reward';

}

@Entity()
class EntityA {

  @PrimaryKey()
  readonly id!: number;

  @Embedded(() => EmbeddableEntity)
  reward = new EmbeddableEntity();

}


let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [EntityA, EmbeddableEntity],
    dbName: ':memory:',
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('correctly build migration for enum type', async () => {
  const up = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(up.trim()).toEqual('create table `entity_a` (`id` integer not null primary key autoincrement, `reward_active` integer not null default false, `reward_email` json not null, `reward_subject` text not null default \'Here is your reward\');');
});
