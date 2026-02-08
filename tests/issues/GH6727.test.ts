import { MikroORM, OptionalProps, types } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class EntityA {
  @PrimaryKey({ type: types.integer })
  id!: number;

  @Property({ type: types.string })
  title!: string;

  @Property({ type: types.datetime, defaultRaw: `NOW() + INTERVAL '1 year'` })
  expiryDate!: Date;

  [OptionalProps]?: 'expiryDate';
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6727',
    entities: [EntityA],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('insert rows, some with, some without values for defaultRaw columns', async () => {
  const currentDate = new Date();
  const sixMonthsFromNow = new Date(currentDate);
  sixMonthsFromNow.setMonth(currentDate.getMonth() + 6);

  await orm.em.insertMany(EntityA, [{ title: 'First item' }, { title: 'Second item', expiryDate: sixMonthsFromNow }]);
});
