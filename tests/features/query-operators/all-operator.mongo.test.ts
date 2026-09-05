import {
  Embeddable,
  Embedded,
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
  SerializedPrimaryKey,
} from '@mikro-orm/decorators/legacy';
import { Collection, MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { mockLogger } from '../../helpers.js';

@Entity()
class Label {
  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  constructor(name: string) {
    this.name = name;
  }
}

@Entity()
class Item {
  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @ManyToMany(() => Label)
  labels = new Collection<Label, Item>(this);

  constructor(name: string) {
    this.name = name;
  }
}

@Entity()
class Article {
  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  title!: string;

  @Property()
  keywords!: string[];

  constructor(title: string, keywords: string[]) {
    this.title = title;
    this.keywords = keywords;
  }
}

@Embeddable()
class Tag {
  @Property()
  name!: string;

  constructor(name: string) {
    this.name = name;
  }
}

@Entity()
class Product {
  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Embedded(() => Tag, { array: true, object: true })
  tags!: Tag[];
}

describe('$all operator in mongo', () => {
  let orm: MikroORM;
  let labelA: Label;
  let labelB: Label;
  let labelC: Label;
  let labelD: Label;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Label, Item, Article, Tag, Product],
      dbName: 'mikro_orm_test_all_operator',
      clientUrl: 'mongodb://localhost:27017',
    });
    await orm.schema.clear();

    labelA = orm.em.create(Label, { name: 'a' });
    labelB = orm.em.create(Label, { name: 'b' });
    labelC = orm.em.create(Label, { name: 'c' });
    labelD = orm.em.create(Label, { name: 'd' });

    orm.em.create(Item, { name: 'item1', labels: [labelA, labelB, labelC] });
    orm.em.create(Item, { name: 'item2', labels: [labelA, labelB] });
    orm.em.create(Item, { name: 'item3', labels: [labelA] });

    orm.em.create(Article, { title: 'article1', keywords: ['foo', 'bar', 'baz'] });
    orm.em.create(Article, { title: 'article2', keywords: ['foo', 'bar'] });
    orm.em.create(Article, { title: 'article3', keywords: ['foo'] });

    orm.em.create(Product, { name: 'product1', tags: [{ name: 'x' }, { name: 'y' }] });
    orm.em.create(Product, { name: 'product2', tags: [{ name: 'x' }] });

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  test('$all on scalar string array', async () => {
    const mock = mockLogger(orm, ['query']);

    const allFooBar = await orm.em.find(Article, { keywords: { $all: ['foo', 'bar'] } });
    expect(allFooBar.map(a => a.title).sort()).toEqual(['article1', 'article2']);

    const allThree = await orm.em.find(Article, { keywords: { $all: ['foo', 'bar', 'baz'] } });
    expect(allThree).toHaveLength(1);
    expect(allThree[0].title).toBe('article1');

    const none = await orm.em.find(Article, { keywords: { $all: ['foo', 'missing'] } });
    expect(none).toHaveLength(0);

    expect(mock.mock.calls[0][0]).toMatch(
      /db\.getCollection\('article'\)\.find\({ keywords: { '\$all': \[ 'foo', 'bar' ] } }, {}\)\.toArray\(\);/,
    );

    const inFooBar = await orm.em.fork().find(Article, { keywords: { $in: ['foo', 'bar'] } });
    expect(inFooBar).toHaveLength(3);
  });

  test('$all on m:n collection with ObjectId conversion', async () => {
    const mock = mockLogger(orm, ['query']);

    const allAB = await orm.em.find(Item, { labels: { $all: [labelA, labelB] } });
    expect(allAB.map(i => i.name).sort()).toEqual(['item1', 'item2']);

    const allABC = await orm.em.find(Item, { labels: { $all: [labelA, labelB, labelC] } });
    expect(allABC).toHaveLength(1);
    expect(allABC[0].name).toBe('item1');

    const allAC = await orm.em.find(Item, { labels: { $all: [labelA, labelC] } });
    expect(allAC).toHaveLength(1);
    expect(allAC[0].name).toBe('item1');

    const none = await orm.em.find(Item, { labels: { $all: [labelA, labelD] } });
    expect(none).toHaveLength(0);

    expect(mock.mock.calls[0][0]).toMatch(
      new RegExp(
        `db\\.getCollection\\('item'\\)\\.find\\({ labels: { '\\$all': \\[ ObjectId\\('${labelA.id}'\\), ObjectId\\('${labelB.id}'\\) ] } }, {}\\)\\.toArray\\(\\);`,
      ),
    );

    const inAB = await orm.em.fork().find(Item, { labels: { $in: [labelA, labelB] } });
    expect(inAB).toHaveLength(3);
  });

  test('$all accepts string ids for m:n collection', async () => {
    const items = await orm.em.find(Item, { labels: { $all: [labelA.id, labelB.id] } });
    expect(items.map(i => i.name).sort()).toEqual(['item1', 'item2']);
  });

  test('an empty $all matches nothing', async () => {
    const articles = await orm.em.find(Article, { keywords: { $all: [] } });
    expect(articles).toHaveLength(0);
  });

  test('$all on an object embeddable array is passed through to mongo', async () => {
    const mock = mockLogger(orm, ['query']);

    const both = await orm.em.find(Product, { tags: { $all: [{ name: 'x' }, { name: 'y' }] } });
    expect(both.map(p => p.name)).toEqual(['product1']);

    const single = await orm.em.fork().find(Product, { tags: { $all: [{ name: 'x' }] } });
    expect(single.map(p => p.name).sort()).toEqual(['product1', 'product2']);

    expect(mock.mock.calls[0][0]).toMatch(
      /db\.getCollection\('product'\)\.find\({ tags: { '\$all': \[ { name: 'x' }, { name: 'y' } ] } }, {}\)\.toArray\(\);/,
    );
  });
});
