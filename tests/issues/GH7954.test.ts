import { MikroORM } from '@mikro-orm/postgresql';
import {
  Embeddable,
  Embedded,
  Entity,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class CommentTemplate {
  @Property({ fieldName: 'comment_template', type: 'varchar' })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

@Entity()
class Child {
  @PrimaryKey()
  id!: number;

  @Embedded(() => CommentTemplate, { prefix: false, nullable: true })
  commentTemplate: CommentTemplate | null = null;
}

@Entity()
class Parent {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => Child)
  child!: Child;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Parent, Child, CommentTemplate],
    dbName: '7954',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('no phantom changeset for nullable flattened embedded with underscore fieldName loaded via joined strategy', async () => {
  const em1 = orm.em.fork();
  const child = em1.create(Child, { id: 1, commentTemplate: new CommentTemplate('hello') });
  em1.create(Parent, { id: 1, child });
  await em1.flush();

  const em2 = orm.em.fork();
  const found = await em2.findOneOrFail(Parent, { id: 1 }, { populate: ['child'], strategy: 'joined' });
  expect(found.child.commentTemplate).toEqual({ value: 'hello' });

  const uow = em2.getUnitOfWork();
  uow.computeChangeSets();
  expect(uow.getChangeSets()).toHaveLength(0);

  await expect(em2.flush()).resolves.not.toThrow();
});
