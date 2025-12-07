import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { EntityComparator, EntityData, MikroORM } from '@mikro-orm/sqlite';

@Entity()
class GH7002 {

  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'Date' })
  createdAt!: Date;

}

describe('GH7002', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [GH7002],
      dbName: ':memory:',
    });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('EntityComparator handles BigInt in date hydration', async () => {
    const comparator = new EntityComparator(orm.getMetadata(), orm.em.getDriver().getPlatform());
    const mapper = comparator.getResultMapper('GH7002');

    // Simulate driver returning BigInt for createdAt
    // We use a timestamp that fits in safe integer range for validation but pass it as BigInt
    const timestamp = 1732676400000;
    const result = {
      id: 1,
      created_at: BigInt(timestamp),
    };

    const hydrated = mapper(result) as EntityData<GH7002>;

    expect(hydrated).not.toBeNull();
    expect(hydrated.createdAt).toBeInstanceOf(Date);
    expect((hydrated.createdAt as Date).getTime()).toBe(timestamp);
  });

});
