import {
  Entity,
  ManyToOne,
  OneToMany,
  Collection,
  ManyToMany,
  MikroORM,
  PrimaryKeyProp,
  PrimaryKey,
  Property, Rel,
} from '@mikro-orm/postgresql';

@Entity({
  tableName: 'accounts_users',
})
class AccountUser {

  @ManyToOne({ entity: () => Account, primary: true })
  account: Rel<Account>;

  @ManyToOne({ entity: () => User, primary: true, updateRule: 'cascade' })
  user: Rel<User>;

  @OneToMany(() => Document, document => document.assignee)
  assignedDocuments = new Collection<Document>(this);

  @ManyToMany(() => Project, project => project.assignedUsers)
  assignedProjects = new Collection<Project>(this);

  [PrimaryKeyProp]?: ['account', 'user'];

  constructor(account: Rel<Account>, user: Rel<User>) {
    this.account = account;
    this.user = user;
  }

}

@Entity()
class Account {

  @PrimaryKey()
  id!: number;

  @ManyToMany({
    entity: () => User,
    pivotEntity: () => AccountUser,
  })
  users = new Collection<User>(this);

  @OneToMany(() => Project, project => project.account)
  projects = new Collection<Project>(this);

}

@Entity({
  tableName: 'documents',
})
class Document {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Project, { index: true })
  project!: Rel<Project>;

  @ManyToOne(() => Account, { hidden: true, index: true })
  account!: Rel<Account>;

  @ManyToOne(() => AccountUser, { nullable: true })
  assignee!: AccountUser;

}

@Entity({
  tableName: 'projects',
})
class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Account, { nullable: true, hidden: true, index: true })
  account?: Account;

  @OneToMany(() => Document, document => document.project)
  documents = new Collection<Document>(this);

  @ManyToMany(() => AccountUser, 'assignedProjects', { owner: true })
  assignedUsers = new Collection<AccountUser>(this);

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  email!: string;

  @ManyToMany({ entity: () => Account, mappedBy: o => o.users })
  accounts = new Collection<Account>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: '5774',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH issue 5774', async () => {
  const account = new Account();
  const user = new User();
  user.email = 'test123abc@mailinator.com';
  account.users.add(user);
  await orm.em.persistAndFlush(account);

  const project1 = new Project();
  project1.name = 'My First Project';
  const foundUser = await orm.em.findOneOrFail(User, {
    email: 'test123abc@mailinator.com',
  });
  const accountUser = await orm.em.findOneOrFail(AccountUser, {
    user: foundUser,
  });
  project1.assignedUsers.add(accountUser);
  await orm.em.persistAndFlush(project1);
  orm.em.clear();

  const document = new Document();
  const document1 = new Document();
  document.account = account;
  document1.account = account;
  const project = await orm.em.findOneOrFail(Project, {
    name: 'My First Project',
  });

  const brokenUser = await orm.em.findOneOrFail(User, {
    email: 'test123abc@mailinator.com',
  });
  const brokenAccountUser = await orm.em.findOneOrFail(
    AccountUser,
    {
      user: brokenUser,
    },
    {
      populate: ['assignedProjects', 'assignedDocuments'],
    },
  );
  document.assignee = brokenAccountUser;
  document1.assignee = brokenAccountUser;
  project.documents.add(document);
  project.documents.add(document1);
  await orm.em.persistAndFlush(project);
});
