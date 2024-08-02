import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mssql';

@Entity()
class Comment {

  @PrimaryKey()
  id!: number;

  @Property()
  content: string;

  constructor(content: string) {
    this.content = content;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Comment],
    dbName: '5811',
    password: 'Root.Root',
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('MsSql should only escape single quotes', async () => {
  const originalComment = new Comment('foo \0null \bbackspace \x1asubstitute \nnew \thtab \vvtab \rreturn \' " \\');
  await orm.em.persistAndFlush(originalComment);
  orm.em.clear();

  const comment = await orm.em.findOne(Comment, { id: originalComment.id });
  expect(comment?.content).toEqual('foo \0null \bbackspace \x1asubstitute \nnew \thtab \vvtab \rreturn \' " \\');
});
