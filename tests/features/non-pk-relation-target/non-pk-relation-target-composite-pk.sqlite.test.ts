import { MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ManyToOne, Unique, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class CompositeUser {
  @PrimaryKey()
  tenant!: string;

  @PrimaryKey()
  code!: string;

  @Property()
  @Unique()
  slug!: string;

  @Property()
  name!: string;
}

@Entity()
class CompositeSession {
  @PrimaryKey()
  id!: number;

  // References CompositeUser by its unique `slug`, not its composite PK
  @ManyToOne(() => CompositeUser, { ref: true, targetKey: 'slug' })
  owner!: Ref<CompositeUser>;
}

describe('targetKey pointing at composite-PK entity', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [CompositeUser, CompositeSession],
      dbName: ':memory:',
    });
  });

  afterAll(() => orm.close(true));

  test('relation metadata follows targetKey, not the composite PK', () => {
    const prop = orm.getMetadata(CompositeSession).properties.owner;
    expect(prop.fieldNames).toEqual(['owner_slug']);
    expect(prop.joinColumns).toEqual(['owner_slug']);
    expect(prop.referencedColumnNames).toEqual(['slug']);
    expect(prop.columnTypes).toHaveLength(1);
  });

  test('schema generation and persistence work', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toMatch(/`owner_slug` text not null/);
    await orm.schema.create();

    const user = orm.em.create(CompositeUser, { tenant: 't1', code: 'c1', slug: 'u-1', name: 'John' });
    orm.em.create(CompositeSession, { owner: user });
    await orm.em.flush();
    orm.em.clear();

    const session = await orm.em.findOneOrFail(CompositeSession, { owner: { slug: 'u-1' } }, { populate: ['owner'] });
    expect(session.owner.$.name).toBe('John');
  });
});
