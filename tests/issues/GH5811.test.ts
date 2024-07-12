import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mssql';
import { initORMMsSql } from '../bootstrap';

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

beforeAll(async () => orm = await initORMMsSql({
  entities: [Comment],
}));
beforeEach(async () => orm.getSchemaGenerator().clearDatabase());
afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('MsSql should not encode newline', async () => {
  const originalComment = new Comment('foo\nbar');
  await orm.em.persistAndFlush(originalComment);
  orm.em.clear();

  const comment = await orm.em.findOne(Comment, { id: originalComment.id });
  expect(comment?.content).toEqual('foo\nbar');
});
