import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

abstract class BaseEntity7389 {
  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt!: Date;

  @Property()
  createdBy!: string;
}

@Entity()
class Task7389 extends BaseEntity7389 {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Task7389],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('#7389', async () => {
  const meta = orm.getMetadata().get(Task7389);
  expect(meta.properties.createdBy.type).toBe('string');
  expect(meta.properties.createdAt.type).toBe('datetime');
  expect(meta.properties.title.type).toBe('string');
});
