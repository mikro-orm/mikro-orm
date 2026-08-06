import { DatabaseSchema, MikroORM } from '@mikro-orm/postgresql';
import { Entity, Index, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'measurement' })
@Index({ name: 'measurement_payload_gin', properties: ['payload'], type: 'gin' })
@Index({ name: 'measurement_recorded_at_brin', properties: ['recordedAt'], type: 'brin' })
class Measurement {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'json' })
  payload!: unknown;

  @Property({ type: 'Date' })
  recordedAt!: Date;
}

describe('index access method [postgres]', () => {
  test('index type is emitted as the access method and survives a round trip [postgres]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Measurement],
      dbName: 'mikro_orm_test_index_access_method',
    });

    await orm.schema.ensureDatabase();

    const createSql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSql).toContain(`create index "measurement_payload_gin" on "measurement" using gin ("payload")`);
    expect(createSql).toContain(
      `create index "measurement_recorded_at_brin" on "measurement" using brin ("recorded_at")`,
    );

    await orm.schema.execute(createSql);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    const schema = await DatabaseSchema.create(orm.em.getConnection(), orm.em.getPlatform(), orm.config);
    const indexes = schema.getTable('measurement')!.getIndexes();
    expect(indexes.find(i => i.keyName === 'measurement_payload_gin')!.type).toBe('gin');
    expect(indexes.find(i => i.keyName === 'measurement_recorded_at_brin')!.type).toBe('brin');

    await orm.schema.dropDatabase();
    await orm.close();
  });
});
