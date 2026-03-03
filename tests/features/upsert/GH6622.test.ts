import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: '*' })
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;
}

@Entity({ schema: '*' })
class Attribute {
  @PrimaryKey()
  id!: number;

  @Property()
  key!: string;

  @Property()
  value!: string;
}

@Entity({ schema: '*' })
class Log {
  @ManyToOne(() => User, { primary: true })
  user!: User;

  @ManyToOne(() => Attribute, { primary: true })
  attribute!: Attribute;

  @Property({ onCreate: () => new Date() })
  createdAt = new Date();
}

let orm: MikroORM;

const SCHEMA_NAME = randomUUID().split('-').join('');

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6622',
    entities: [Attribute, Log, User],
  });
  await orm.schema.refresh();
  await orm.schema.create({ schema: SCHEMA_NAME });

  orm.em.schema = SCHEMA_NAME;

  orm.em.create(Attribute, { id: 1, key: 'key', value: 'value' });
  orm.em.create(User, { id: 1, email: 'test@example.com', name: 'Test User #1' });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('setting schema via entity manager property', async () => {
  orm.em.schema = SCHEMA_NAME;

  const user = await orm.em.findOneOrFail(User, { id: 1 });
  const attribute = await orm.em.findOneOrFail(Attribute, { id: 1 });

  await orm.em.upsert(
    Log,
    {
      user,
      attribute,
      createdAt: new Date(),
    },
    {
      onConflictAction: 'ignore',
      onConflictFields: ['attribute', 'user'],
    },
  );
});

test('setting schema via upsert options property', async () => {
  const user = await orm.em.findOneOrFail(User, { id: 1 });
  const attribute = await orm.em.findOneOrFail(Attribute, { id: 1 });

  await orm.em.upsertMany(
    Log,
    [
      {
        user,
        attribute,
        createdAt: new Date(),
      },
    ],
    {
      onConflictAction: 'ignore',
      onConflictFields: ['attribute', 'user'],
      schema: SCHEMA_NAME,
    },
  );
});
