import { Collection, Embeddable, Embedded, Entity, IdentifiedReference, LoadStrategy, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Cat {

  @PrimaryKey()
  name!: string;

  @ManyToOne(() => User, { wrappedReference: true })
  user!: IdentifiedReference<User>;

}

@Embeddable()
export class Profile {

  @Property({ nullable: true })
  phoneNumber?: string;

  @Property({ nullable: true })
  prefix?: string;

}

@Entity()
export class User {

  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Embedded(() => Profile, { nullable: true })
  profile?: Profile;

  @OneToMany(() => Cat, c => c.user)
  cats = new Collection<Cat>(this);

}

describe('GH issue #2717', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: ':memory:',
      driver: SqliteDriver,
      loadStrategy: LoadStrategy.JOINED,
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close();
  });

  test(`diffing`, async () => {
    orm.em.create(User, {
      id: 'TestPrimary',
      name: 'TestName',
      profile: { phoneNumber: '123', prefix: '456' },
      cats: [{ name: 'c1' }, { name: 'c2' }],
    }, { persist: true });
    await orm.em.fork().flush();

    const user = await orm.em.find(User, {}, { populate: ['cats'] });
    expect(user[0].profile).toMatchObject({ phoneNumber: '123', prefix: '456' });
    expect(user[0].cats.$.getItems()).toMatchObject([{ name: 'c1' }, { name: 'c2' }]);
  });

});
