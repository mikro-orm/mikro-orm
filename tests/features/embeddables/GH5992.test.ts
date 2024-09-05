import { Collection, Embeddable, Embedded, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Embeddable()
class FileEmbeddable {

  @Property()
  url: string;

  constructor(url: string) {
    this.url = url;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  email: string;

  @Embedded(() => FileEmbeddable, {
    object: true,
  })
  avatar: FileEmbeddable;

  @ManyToMany(() => MailingList, ml => ml.recipients)
  recipientOf = new Collection<MailingList>(this);

  constructor(email: string, avatar: FileEmbeddable) {
    this.email = email;
    this.avatar = avatar;
  }

}

@Entity()
export class MailingList {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  name: string;

  @ManyToMany(() => User, 'recipientOf', {
    name: 'recipients',
    owner: true,
  })
  recipients = new Collection<User>(this);

  constructor(name: string) {
    this.name = name;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [FileEmbeddable, User, MailingList],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('5992', async () => {
  const user = orm.em.create(User, {
    email: 'foo@foo.com',
    avatar: new FileEmbeddable('https://foo.com'),
  });
  orm.em.create(MailingList, { name: 'foolist', recipients: [user] });
  await orm.em.flush();

  const actual = await orm.em.find(MailingList, { name: 'foolist' }, {
    fields: ['recipients.avatar.url'],
    refresh: true,
  });

  expect(actual[0].recipients[0].avatar.url).toBe('https://foo.com');
});
