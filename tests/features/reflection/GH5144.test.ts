import {
  Collection,
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  ref,
  Ref,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

enum AccountType {
  User = 1,
  Organiztion = 2,
}

@Entity()
class Account {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  balance: number = 0;

  @OneToOne(() => User, 'account')
  user?: Ref<User>;

  @OneToOne(() => Organization, 'account')
  organization?: Ref<Organization>;

  @Enum(() => AccountType)
  type!: AccountType;

  constructor(name: string, startBalance: number = 0, type = AccountType.User) {
    this.name = name;
    this.balance = startBalance;
    this.type = type;
  }

}

@Entity()
class User {

  @OneToOne({ primary: true })
  account!: Ref<Account>;

  @Property()
  username!: string;

  @Property({ hidden: true })
  password!: string;

  @OneToMany(() => Organization, org => org.owner)
  organizations = new Collection<Organization>(this);

  [PrimaryKeyProp]?: 'account';

  constructor(account: Account, username: string, password: string) {
    this.account = ref(account);
    this.username = username;
    this.password = password;
  }

}

@Entity()
class Organization {

  @OneToOne({ primary: true })
  account!: Ref<Account>;

  @ManyToOne()
  owner!: Ref<User>;

  [PrimaryKeyProp]?: 'account';

  constructor(account: Account, owner: User) {
    this.account = ref(account);
    this.owner = ref(owner);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Organization, Account, User],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('#5144', async () => {
  const schema = await orm.schema.getCreateSchemaSQL();
  expect(schema).toMatchSnapshot();
});
