import { MikroORM, Ref, ref, Opt } from '@mikro-orm/sqlite';
import { Entity, Filter, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Account {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
@Filter({ name: 'notDeleted', cond: { deleted: false }, default: true })
class Document {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  deleted: Opt<boolean> = false;
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  email: string;

  @ManyToOne(() => Account, { ref: true, eager: true, strategy: 'joined' })
  account!: Ref<Account>;

  @ManyToOne(() => Document, { ref: true, nullable: true })
  lastDocument?: Ref<Document>;

  constructor(email: string, account: Account) {
    this.email = email;
    this.account = ref(account);
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Document, Account],
    loadStrategy: 'select-in',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('findOne returns null when populating non-eager relation with soft-deleted entity using "%s" strategy', async () => {
  // Setup
  const account = orm.em.create(Account, { name: 'Premium' });
  const document = orm.em.create(Document, { title: 'Document 1' });
  await orm.em.flush();

  const user = orm.em.create(User, { email: 'user@example.com', account });
  user.lastDocument = ref(document);
  await orm.em.flush();

  const userId = user.id;
  orm.em.clear();

  // Verify user exists before soft delete
  const userBefore = await orm.em.findOne(User, { id: userId });
  expect(userBefore).not.toBeNull();

  // Soft delete the document
  const docToDelete = await orm.em.findOneOrFail(
    Document,
    { id: document.id },
    {
      filters: { notDeleted: false },
    },
  );
  docToDelete.deleted = true;
  await orm.em.flush();
  orm.em.clear();

  // BUG: Populating a non-eager relation that has a global filter causes findOne to return null
  const userAfter = await orm.em.findOne(
    User,
    { id: userId },
    {
      populate: ['lastDocument'],
    },
  );

  expect(userAfter).not.toBeNull();
  expect(userAfter?.email).toBe('user@example.com');
});

test('findOne works when relation is not populated', async () => {
  // Setup
  const account2 = orm.em.create(Account, { name: 'Basic' });
  const document2 = orm.em.create(Document, {
    title: 'Document 2',
    deleted: true,
  });
  const user2 = orm.em.create(User, {
    email: 'user2@example.com',
    account: account2,
  });
  user2.lastDocument = ref(document2);
  await orm.em.flush();

  const userId2 = user2.id;
  orm.em.clear();

  // Without populate, the query works correctly
  const result = await orm.em.findOne(User, { id: userId2 });

  expect(result).not.toBeNull();
  expect(result?.email).toBe('user2@example.com');
});
