import { Entity, Enum, MikroORM, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Person {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  lastName!: string;

  @Property({ unique: true })
  email!: string;

  @OneToOne({ entity: 'User', mappedBy: 'person' })
  user!: any;

}

export enum State {
  Queued,
  Running,
  Waiting,
}

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  login!: string;

  @Property({ hidden: true })
  password!: string;

  @OneToOne({ entity: () => Person, inversedBy: person => person.user })
  person!: Person;

  @Enum({ items: () => State })
  state!: number;

}

describe('GH issue 1150', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Person],
      dbName: `mikro_orm_test_gh_1150`,
      type: 'postgresql',
    });

    const generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.dropSchema();
    await generator.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  it('em.create() with nested 1:1 relation', async () => {
    const user = orm.em.create(User, {
      login: 'some.login',
      password: 'somepassword@#10',
      person: {
        name: 'Carlos Eduardo',
        lastName: 'de Oliveira Paludetto',
        email: 'some@mail.com',
      },
      state: State.Running,
    });
    await orm.em.persistAndFlush(user);
    expect(user.id).not.toBeUndefined();
    expect(user.person.id).not.toBeUndefined();
  });

  it('numeric enum diffing (GH issue #1096)', async () => {
    const generator = orm.getSchemaGenerator();
    await expect(generator.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

});
