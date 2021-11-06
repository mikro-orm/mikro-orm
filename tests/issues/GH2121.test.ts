import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Tag {

  @PrimaryKey()
  id!: number;

  @Property()
  slug!: string;

}

@Entity()
export class Product {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

}

describe('GH issue 2121', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Tag, Product],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('populating m:n collection', async () => {
    const tag = orm.em.create(Tag, { slug: 'slug0' });
    const tag2 = orm.em.create(Tag, { slug: 'slug2' });

    for (let i = 0; i < 10; i++) {
      const product = orm.em.create(Product, {
        name: 'product' + i,
        tags: [tag, tag2],
      });
      orm.em.persist(product);
    }

    await orm.em.flush();
    await orm.em.clear();
    const result = await orm.em.find(Product, { tags: { slug: ['slug0'] } }, {
      populate: ['tags'],
      limit: 10,
      offset: 8,
    });
    expect(result[0].tags).toHaveLength(1);
    await orm.em.clear();

    const result2 = await orm.em.find(Product, { tags: { slug: ['slug0'] } }, {
      populate: ['tags'],
      limit: 10,
      offset: 9,
    });
    expect(result2[0].tags).toHaveLength(1);
    await result2[0].tags.init();
  });

});
