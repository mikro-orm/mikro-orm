import { Collection, JsonType, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class ParentEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToMany(() => TestEntity, test => test.parent, { eager: true })
  children = new Collection<TestEntity>(this);

}

@Entity()
class TestEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ type: JsonType })
  richTextDescription!: Record<string, any>;

  @ManyToOne(() => ParentEntity)
  parent!: ParentEntity;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [TestEntity],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH issue 6674', async () => {
  const newChild = new TestEntity();
  newChild.title = 'child 1';
  newChild.richTextDescription = { json: { example: 1 } };
  const example = new ParentEntity();
  example.title = 'test parent';
  example.children.add(newChild);
  await orm.em.persist(example).flush();
  await orm.em.refresh(example);

  example.title = 'new title';
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).toHaveBeenCalledTimes(3);
});
