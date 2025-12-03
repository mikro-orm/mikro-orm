import { Collection, MikroORM, Ref, Reference } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @OneToMany('Chat', 'owner')
  ownedChats = new Collection<Chat>(this);

}

@Entity()
export class Chat {

  @ManyToOne(() => User, { primary: true, ref: true })
  owner: Ref<User>;

  @ManyToOne(() => User, { primary: true, ref: true })
  recipient: Ref<User>;

  @ManyToOne(() => User, { nullable: true })
  User?: User;

  constructor(owner: User, recipient: User) {
    this.owner = Reference.create(owner);
    this.recipient = Reference.create(recipient);
  }

}

describe('GH issue 589', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Chat],
      dbName: `mikro_orm_test_gh_589`,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(() => orm.em.clear());

  test(`GH issue 589 (originally working)`, async () => {
    const user1 = new User();
    await orm.em.persist(user1).flush();
    const user2 = new User();
    await orm.em.persist(user2).flush();
    const chat1 = new Chat(user1, user2);
    orm.em.persist(chat1);
    const chat2 = new Chat(user2, user1);
    orm.em.persist(chat2);

    await expect(orm.em.flush()).resolves.toBeUndefined();
  });

  test(`GH issue 589 (originally failing)`, async () => {
    const user3 = new User();
    await orm.em.persist(user3).flush();
    const user4 = new User();
    await orm.em.persist(user4).flush();
    const chat3 = new Chat(user3, user4);
    await orm.em.persist(chat3).flush();
    const chat4 = new Chat(user4, user3);
    orm.em.persist(chat4);

    await expect(orm.em.flush()).resolves.toBeUndefined();
  });

  test(`GH issue 655 (originally failing)`, async () => {
    const user1 = new User();
    const chat1 = new Chat(user1, user1);
    chat1.User = user1;
    await orm.em.persist(chat1).flush();
    orm.em.clear();

    await orm.em.find(Chat, {}, { populate: ['User'] });
  });

});
