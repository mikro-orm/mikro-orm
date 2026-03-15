import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity()
class Bar7312 {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;
}

test('GH #7312 - Symbol.metadata polyfill is present', () => {
  expect((Symbol as any).metadata).toBeDefined();
  expect(typeof (Symbol as any).metadata).toBe('symbol');
});

test('GH #7312 - ES decorators propagate metadata to class decorator', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Bar7312],
  });

  const meta = orm.getMetadata().get(Bar7312);
  expect(meta.properties.id).toBeDefined();
  expect(meta.properties.name).toBeDefined();
  expect(meta.class).toBe(Bar7312);

  await orm.close(true);
});
