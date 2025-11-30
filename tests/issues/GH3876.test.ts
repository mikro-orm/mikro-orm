import { MikroORM } from '@mikro-orm/postgresql';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { Collection, LoadStrategy, Rel } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity()
class Book {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property()
  name!: string;

  @Property({ nullable: true })
  description?: string;

  @ManyToOne({ entity: () => User })
  user!: Rel<User>;

}

@Entity()
class ProfileInfo {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property()
  email!: string;

  @OneToOne({
    entity: () => User,
    mappedBy: user => user.profileInfo,
  })
  user!: Rel<User>;

}

@Entity()
class User {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property()
  name!: string;

  @OneToOne({
    entity: () => ProfileInfo,
    nullable: true,
  })
  profileInfo?: ProfileInfo;

  @OneToMany({
    entity: () => Book,
    mappedBy: book => book.user,
  })
  books = new Collection<Book>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    loadStrategy: LoadStrategy.JOINED,
    dbName: 'mikro_orm_3876',
    entities: [Book, User, ProfileInfo],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('3876', async () => {
  const user = orm.em.create(User, {
    name: 'user1',
  });
  orm.em.create(Book, {
    name: 'book1',
    user,
  });
  orm.em.create(Book, {
    name: 'book2',
    user,
  });
  await orm.em.flush();
  orm.em.clear();

  await orm.em.find(Book, {}, { populate: ['user'] });
  const uow1 = orm.em.getUnitOfWork();
  uow1.computeChangeSets();

  expect(uow1.getChangeSets()).toHaveLength(0);
});
