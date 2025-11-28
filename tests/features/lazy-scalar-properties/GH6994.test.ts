import { ObjectId, defineConfig, MikroORM } from '@mikro-orm/mongodb';
import { Embeddable, Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider, SerializedPrimaryKey } from '@mikro-orm/decorators/legacy';

@Embeddable()
class Inner {

  @Property({ hidden: true, lazy: true })
  secret: string;

  @Property()
  public: string;

  constructor() {
    this.secret = 'secret shh';
    this.public = 'public';
  }

}

@Embeddable()
class NextLevel {

  @Property()
  aa: string;

  @Embedded()
  inner: Inner;

  constructor(inner: Inner) {
    this.inner = inner;
    this.aa = 'aa';
  }

}

@Entity()
class TopLevel {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Embedded()
  nextLevel: NextLevel;

  constructor(nextLevel: NextLevel) {
    this.nextLevel = nextLevel;
  }

}

let orm: MikroORM;
let id: string;

beforeAll(async () => {
  orm = await MikroORM.init(defineConfig({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6994',
    entities: [TopLevel, Inner, NextLevel],
  }));

  const item = orm.em.create(TopLevel, new TopLevel(new NextLevel(new Inner())));
  await orm.em.persistAndFlush(item);

  id = item.id;
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('Basic no populate result', async () => {
  const result = await orm.em.findOneOrFail(TopLevel, id);
  expect(result.nextLevel.inner.secret).toBe(undefined);
});

test('Bad result, but valid TS', async () => {
  const result = await orm.em.findOneOrFail(TopLevel, id, { populate: ['nextLevel.inner.secret'] });
  expect(result.nextLevel.inner.secret).toBe('secret shh');
});
