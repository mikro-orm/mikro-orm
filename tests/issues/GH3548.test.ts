import { Entity, PrimaryKey, Property, OneToOne } from '@mikro-orm/core';
import { MikroORM, ObjectId } from '@mikro-orm/mongodb';

@Entity()
export class Author {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  termsAccepted: boolean = false;

  @OneToOne('AuthorDetail', 'author', { owner: true })
  authorDetail!: any;

}

@Entity()
export class AuthorDetail {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @OneToOne(() => Author, b => b.authorDetail)
  author!: Author;

  constructor(name: string) {
    this.name = name;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [AuthorDetail],
    clientUrl: 'mongodb://localhost:27017/mikro-orm-3548',
  });
  await orm.schema.clearDatabase();
});

afterAll(() => orm.close(true));

test('GH issue 3548', async () => {
  const authorDetail = new AuthorDetail('name');
  const author = new Author();
  authorDetail.author = author;
  author.authorDetail = authorDetail;
  await orm.em.fork().persist(author).flush();

  const r1 = await orm.em.fork().find(AuthorDetail, {}, { populate: true });
  expect(r1[0]).toMatchObject({
    _id: expect.any(ObjectId),
    name: 'name',
    author: {
      _id: expect.any(ObjectId),
      termsAccepted: false,
      authorDetail: {
        name: 'name',
      },
    },
  });

  const r2 = await orm.em.fork().find(Author, {}, { populate: true });
  expect(r2[0]).toMatchObject({
    _id: expect.any(ObjectId),
    authorDetail: {
      _id: expect.any(ObjectId),
      name: 'name',
      author: {
        termsAccepted: false,
      },
    },
  });
});
