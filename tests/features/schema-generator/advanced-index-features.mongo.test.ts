import { MikroORM } from '@mikro-orm/core';
import { MongoDriver, ObjectId, MongoSchemaGenerator } from '@mikro-orm/mongodb';
import { Entity, Index, PrimaryKey, Property, SerializedPrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'test_collection' })
@Index({
  properties: ['email'],
})
@Index({
  name: 'invisible_idx',
  properties: ['name'],
  invisible: true,
})
class TestEntity {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Property()
  email!: string;

}

describe('advanced index features in mongodb', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: MongoDriver,
      entities: [TestEntity],
      dbName: `mikro_orm_test_adv_idx_mongo`,
      metadataProvider: ReflectMetadataProvider,
    });
    // Clean up any existing collection
    try {
      await orm.em.getDriver().getConnection().dropCollection(TestEntity);
    } catch {
      // Collection may not exist
    }
  });

  afterAll(() => orm.close(true));

  test('schema generator creates hidden indexes from invisible option', async () => {
    // Spy on the createIndex call to verify the options
    const createIndexCalls: { fieldOrSpec: unknown; options: any }[] = [];
    const originalExecuteQuery = (MongoSchemaGenerator.prototype as any).executeQuery;

    vi.spyOn(MongoSchemaGenerator.prototype as any, 'executeQuery').mockImplementation(
      function (this: any, collection: any, method: any, ...args: any[]) {
        if (method === 'createIndex') {
          createIndexCalls.push({ fieldOrSpec: args[0], options: args[1] });
        }
        return originalExecuteQuery.call(this, collection, method, ...args);
      },
    );

    await orm.schema.create();

    // Verify that the invisible index has hidden: true
    const invisibleIndex = createIndexCalls.find(call => call.options?.name === 'invisible_idx');
    expect(invisibleIndex).toBeDefined();
    expect(invisibleIndex!.options.hidden).toBe(true);

    // Verify that the regular index does NOT have hidden: true
    const regularIndex = createIndexCalls.find(call => call.options?.name !== 'invisible_idx');
    expect(regularIndex).toBeDefined();
    expect(regularIndex!.options.hidden).toBeUndefined();

    vi.restoreAllMocks();
  });

});
