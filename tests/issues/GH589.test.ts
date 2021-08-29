import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, PrimaryKeyType, Reference, IdentifiedReference } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @OneToMany('Chat', 'owner')
  ownedChats = new Collection<Chat>(this);

}

@Entity()
export class Chat {

  @ManyToOne(() => User, { primary: true, wrappedReference: true })
  owner: IdentifiedReference<User>;

  @ManyToOne(() => User, { primary: true, wrappedReference: true })
  recipient: IdentifiedReference<User>;

  @ManyToOne(() => User, { nullable: true })
  User?: User;

  [PrimaryKeyType]: [number, number];

  constructor(owner: User, recipient: User) {
    this.owner = Reference.create(owner);
    this.recipient = Reference.create(recipient);
  }

}

describe('GH issue 589', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Chat],
      dbName: `mikro_orm_test_gh_589`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(() => orm.em.clear());

  test(`GH issue 589 (originally working)`, async () => {
    const user1 = new User();
    await orm.em.persistAndFlush(user1);
    const user2 = new User();
    await orm.em.persistAndFlush(user2);
    const chat1 = new Chat(user1, user2);
    orm.em.persist(chat1);
    const chat2 = new Chat(user2, user1);
    orm.em.persist(chat2);

    await expect(orm.em.flush()).resolves.toBeUndefined();
  });

  test(`GH issue 589 (originally failing)`, async () => {
    const user3 = new User();
    await orm.em.persistAndFlush(user3);
    const user4 = new User();
    await orm.em.persistAndFlush(user4);
    const chat3 = new Chat(user3, user4);
    await orm.em.persistAndFlush(chat3);
    const chat4 = new Chat(user4, user3);
    orm.em.persist(chat4);

    await expect(orm.em.flush()).resolves.toBeUndefined();
  });

  test(`GH issue 655 (originally failing)`, async () => {
    const user1 = new User();
    const chat1 = new Chat(user1, user1);
    chat1.User = user1;
    await orm.em.persistAndFlush(chat1);
    orm.em.clear();

    await orm.em.find(Chat, {}, { populate: ['User'] });
  });

});
