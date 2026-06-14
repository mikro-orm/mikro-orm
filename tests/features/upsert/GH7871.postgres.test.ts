import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

@Entity({ discriminatorColumn: 'type', abstract: true })
class Base {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  key!: string;

  @Property()
  type!: string;
}

@Entity({ discriminatorValue: 'a' })
class A extends Base {
  @Property({ nullable: true })
  x?: string;
}

@Entity({ discriminatorValue: 'b' })
class B extends Base {
  @Property({ nullable: true })
  y?: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '7871',
    entities: [Base, A, B],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('upsertMany with distinct subclass schemas keeps subclass-specific props', async () => {
  // first row is a B (no `x`), second row is an A (with `x`)
  await orm.em
    .fork()
    .upsertMany(Base, [{ key: 'b1', type: 'b', y: 'yval' } as B, { key: 'a1', type: 'a', x: 'xval' } as A]);

  const em = orm.em.fork();
  const a = await em.findOneOrFail(A, { key: 'a1' });
  const b = await em.findOneOrFail(B, { key: 'b1' });

  expect(b.y).toBe('yval');
  expect(a.x).toBe('xval');
});
