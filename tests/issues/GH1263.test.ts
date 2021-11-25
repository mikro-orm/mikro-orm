import { Entity, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { parse, stringify, v4 as uuid } from 'uuid';

class UUID extends Type<string, Buffer> {

  convertToJSValue(value: Buffer) {
    return stringify(value);
  }

  convertToDatabaseValue(value: string) {
    return Buffer.from(parse(value) as any[]);
  }

  getColumnType() {
    return 'binary(16)';
  }

}

@Entity()
class User {

  @PrimaryKey({ type: UUID })
  id = uuid();

  @Property({ nullable: true })
  name?: string;

}


describe('GH issue 1263', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1263`, async () => {
    const testCases: ((id: string) => Promise<any>)[] = [
      async id => orm.em.nativeDelete(User, await orm.em.findOneOrFail(User, id)),
      async id => orm.em.removeAndFlush(await orm.em.findOneOrFail(User, id)),
      id => orm.em.nativeDelete(User, id),
      id => orm.em.nativeDelete(User, { id }),
      id => orm.em.nativeDelete(User, [id]),
      id => orm.em.nativeDelete(User, [id, { id }]),
    ];

    for (const testCase of testCases) {
      const id = uuid();

      const user = new User();
      user.id = id;
      await orm.em.persist(user).flush();
      orm.em.clear();

      await testCase(id);
      const userCount = await orm.em.count(User, id);
      expect(userCount).toBe(0);
    }

    {
      const user = new User();
      user.id = uuid();
      user.name = 'foo';
      await orm.em.persist(user).flush();
      user.name = 'foo bar';
      await orm.em.flush();
      const userCount = await orm.em.count(User, { name: 'foo bar' });
      expect(userCount).toBe(1);
    }
  });

});
