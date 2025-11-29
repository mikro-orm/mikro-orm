import { Collection, LoadStrategy } from '@mikro-orm/core';
import { Entity, ManyToMany, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Account {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Account, { nullable: true })
  parent!: Account | null;

  @Property({ persist: false })
  parentId!: number | null;

  @ManyToMany(() => User, user => user.accounts)
  users = new Collection<User>(this);

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Account)
  accounts = new Collection<Account>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`relations' orderBy should be respected when using LoadStrategy.JOINED`, async () => {
  const a = await orm.em.insert(Account, { id: 1 });
  const b = await orm.em.insert(Account, { id: 2, parent: a });
  const u = await orm.em.insert(User, { id: 11, accounts: [1, 2] });
  const r1 = await orm.em.fork().findOneOrFail(User, { id: 11 }, { populate: ['accounts'], strategy: LoadStrategy.SELECT_IN });
  expect(r1.accounts.$[0].parent).toBe(null);
  expect(r1.accounts.$[0].parentId).toBe(null);
  expect(r1.accounts.$[1].parent?.id).toBe(1);
  expect(r1.accounts.$[1].parentId).toBe(1);
  const r2 = await orm.em.fork().findOneOrFail(User, { id: 11 }, { populate: ['accounts'], strategy: LoadStrategy.JOINED });
  expect(r2.accounts.$[0].parent).toBe(null);
  expect(r2.accounts.$[0].parentId).toBe(null);
  expect(r2.accounts.$[1].parent?.id).toBe(1);
  expect(r2.accounts.$[1].parentId).toBe(1);
});
