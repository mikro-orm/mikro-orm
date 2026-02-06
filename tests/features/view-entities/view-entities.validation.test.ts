import { defineEntity, p, MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

describe('View entity validation', () => {

  test('view entity without expression should throw', async () => {
    @Entity({ tableName: 'invalid_view', view: true })
    class InvalidView {

      @PrimaryKey()
      id!: number;

    }

    await expect(MikroORM.init({
      entities: [InvalidView],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    })).rejects.toThrow(/view.*expression/i);
  });

  test('view entity with expression should be valid', async () => {
    const ValidView = defineEntity({
      name: 'ValidView',
      tableName: 'valid_view',
      view: true,
      expression: 'select 1 as id',
      properties: {
        id: p.integer().primary(),
      },
    });

    const orm = await MikroORM.init({
      entities: [ValidView],
      dbName: ':memory:',
    });

    expect(orm.getMetadata(ValidView).view).toBe(true);
    expect(orm.getMetadata(ValidView).expression).toBe('select 1 as id');

    await orm.close();
  });

});
