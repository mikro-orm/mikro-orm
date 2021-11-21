import { MikroORM, Entity, PrimaryKey, Property, OptimisticLockError } from '@mikro-orm/core';
import { mockLogger } from '../../helpers';

@Entity()
export class ConcurrencyCheckUser {

  @PrimaryKey({ length: 100 })
  firstName: string;

  @PrimaryKey({ length: 100, concurrencyCheck: true })
  lastName: string;

  @Property({ concurrencyCheck: true })
  age: number;

  @Property({ nullable: true })
  other?: string;

  constructor(firstName: string, lastName: string, age: number) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
  }

}

describe('optimistic locking - concurrency check (postgres)', () => {

  let orm: MikroORM;
  let mock: jest.Mock;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [ConcurrencyCheckUser],
      dbName: `mikro_orm_test_concurrency_check`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
    mock = mockLogger(orm, ['query', 'query-params']);
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(ConcurrencyCheckUser, {});
    orm.em.clear();
    mock.mockReset();
  });

  afterAll(async () => orm.close(true));

  test('should compare original to database value on entity update', async () => {
    const test = new ConcurrencyCheckUser('Jakub', 'Smith', 20);
    test.other = 'dsa';

    await orm.em.persistAndFlush(test);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into "concurrency_check_user" ("age", "first_name", "last_name", "other") values (20, \'Jakub\', \'Smith\', \'dsa\')');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mockReset();

    test.age = 30;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('update "concurrency_check_user" set "age" = 30 where "first_name" = \'Jakub\' and "last_name" = \'Smith\' and "age" = 20');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mockReset();

    test.age = 40;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('update "concurrency_check_user" set "age" = 40 where "first_name" = \'Jakub\' and "last_name" = \'Smith\' and "age" = 30');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mockReset();

    test.other = 'asd';
    await expect(orm.em.flush()).rejects.toThrowError(`The optimistic lock on entity ConcurrencyCheckUser failed`);

    mock.mockReset();

    test.age = 41;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('update "concurrency_check_user" set "age" = 41, "other" = \'asd\' where "first_name" = \'Jakub\' and "last_name" = \'Smith\' and "age" = 40');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('throws when someone changed the state in the meantime', async () => {
    const test = new ConcurrencyCheckUser('Jakub', 'Smith', 20);
    test.other = 'dsa';
    await orm.em.fork().persistAndFlush(test);

    const test2 = await orm.em.findOneOrFail(ConcurrencyCheckUser, test);
    await orm.em.nativeUpdate(ConcurrencyCheckUser, test, { age: 123 }); // simulate concurrent update
    test2!.age = 50;
    test2!.other = 'WHATT???';

    try {
      await orm.em.flush();
      expect(1).toBe('should be unreachable');
    } catch (e: any) {
      expect(e).toBeInstanceOf(OptimisticLockError);
      expect(e.message).toBe(`The optimistic lock on entity ConcurrencyCheckUser failed`);
      expect((e as OptimisticLockError).getEntity()).toBe(test2);
    }
  });

  test('should compare original to database value on entity update (batch update)', async () => {
    const test1 = new ConcurrencyCheckUser('Jakub', 'Smith', 20);
    test1.other = 'dsa';
    const test2 = new ConcurrencyCheckUser('John', 'Smith', 25);
    test2.other = 'lol';

    await orm.em.persistAndFlush([test1, test2]);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(`insert into "concurrency_check_user" ("first_name", "last_name", "age", "other") values ('Jakub', 'Smith', 20, 'dsa'), ('John', 'Smith', 25, 'lol')`);
    expect(mock.mock.calls[2][0]).toMatch('commit');

    mock.mockReset();

    test1.age = 30;
    test2.age = 35;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(`select "c0"."first_name", "c0"."last_name", "c0"."age" from "concurrency_check_user" as "c0" where (("c0"."first_name" = 'Jakub' and "c0"."last_name" = 'Smith' and "c0"."age" = 20) or ("c0"."first_name" = 'John' and "c0"."last_name" = 'Smith' and "c0"."age" = 25))`);
    expect(mock.mock.calls[2][0]).toMatch(`update "concurrency_check_user" set "age" = case when ("first_name" = 'Jakub' and "last_name" = 'Smith') then 30 when ("first_name" = 'John' and "last_name" = 'Smith') then 35 else "age" end where ("first_name", "last_name", "age") in (('Jakub', 'Smith', 20), ('John', 'Smith', 25))`);
    expect(mock.mock.calls[3][0]).toMatch('commit');

    mock.mockReset();

    test1.age = 40;
    test2.age = 45;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(`select "c0"."first_name", "c0"."last_name", "c0"."age" from "concurrency_check_user" as "c0" where (("c0"."first_name" = 'Jakub' and "c0"."last_name" = 'Smith' and "c0"."age" = 30) or ("c0"."first_name" = 'John' and "c0"."last_name" = 'Smith' and "c0"."age" = 35))`);
    expect(mock.mock.calls[2][0]).toMatch(`update "concurrency_check_user" set "age" = case when ("first_name" = 'Jakub' and "last_name" = 'Smith') then 40 when ("first_name" = 'John' and "last_name" = 'Smith') then 45 else "age" end where ("first_name", "last_name", "age") in (('Jakub', 'Smith', 30), ('John', 'Smith', 35))`);
    expect(mock.mock.calls[3][0]).toMatch('commit');

    mock.mockReset();

    test1.other = 'asd';
    test2.other = 'lololol';
    await expect(orm.em.flush()).rejects.toThrowError(`The optimistic lock on entity ConcurrencyCheckUser failed`);

    mock.mockReset();

    test1.age = 41;
    test2.age = 46;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch(`select "c0"."first_name", "c0"."last_name", "c0"."age" from "concurrency_check_user" as "c0" where (("c0"."first_name" = 'Jakub' and "c0"."last_name" = 'Smith' and "c0"."age" = 40) or ("c0"."first_name" = 'John' and "c0"."last_name" = 'Smith' and "c0"."age" = 45))`);
    expect(mock.mock.calls[2][0]).toMatch(`update "concurrency_check_user" set "age" = case when ("first_name" = 'Jakub' and "last_name" = 'Smith') then 41 when ("first_name" = 'John' and "last_name" = 'Smith') then 46 else "age" end, "other" = case when ("first_name" = 'Jakub' and "last_name" = 'Smith') then 'asd' when ("first_name" = 'John' and "last_name" = 'Smith') then 'lololol' else "other" end where ("first_name", "last_name", "age") in (('Jakub', 'Smith', 40), ('John', 'Smith', 45))`);
    expect(mock.mock.calls[3][0]).toMatch('commit');
  });

  test('throws when someone changed the state in the meantime (batch update)', async () => {
    const test1 = new ConcurrencyCheckUser('Jakub', 'Smith', 20);
    test1.other = 'dsa';
    const test2 = new ConcurrencyCheckUser('John', 'Smith', 25);
    test2.other = 'lol';

    await orm.em.fork().persistAndFlush([test1, test2]);

    const tests = await orm.em.find(ConcurrencyCheckUser, {}, { orderBy: { age: 1 } });
    await orm.em.nativeUpdate(ConcurrencyCheckUser, tests[0], { age: 123 }); // simulate concurrent update
    await orm.em.nativeUpdate(ConcurrencyCheckUser, tests[1], { age: 124 }); // simulate concurrent update
    tests[0].age = 50;
    tests[0].other = 'WHATT???';
    tests[1].age = 51;
    tests[1].other = 'WHATT???';

    try {
      await orm.em.flush();
      expect(1).toBe('should be unreachable');
    } catch (e: any) {
      expect(e).toBeInstanceOf(OptimisticLockError);
      expect(e.message).toBe(`The optimistic lock on entity ConcurrencyCheckUser failed`);
      expect((e as OptimisticLockError).getEntity()).toBe(tests[0]);
    }
  });

});
