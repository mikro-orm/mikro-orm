import { Entity, MikroORM, PrimaryKey, Property, TextType } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

class SpecialTextType extends TextType {

  convertToDatabaseValue(value?: string | undefined): string | undefined {
    return `${value}-${Math.random()}`;
  }

  convertToJSValue(value?: string | undefined): string | undefined {
    return value?.split('-')[0];
  }

  compareValues(a?: string, b?: string): boolean {
    return a?.split('-')[0] === b?.split('-')[0];
  }

}

@Entity()
class Driver {

  @PrimaryKey()
  id!: number;

  @Property({ type: SpecialTextType })
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: `:memory:`,
    entities: [Driver],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test(`custom type with custom comparator`, async () => {
  const newDriver = orm.em.create(Driver, {
    name: 'Foo',
  });
  const mock = mockLogger(orm, ['query']);
  await orm.em.persistAndFlush(newDriver);
  expect(mock).toHaveBeenCalledTimes(3);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('insert into `driver` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[2][0]).toMatch('commit');
  mock.mockReset();

  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
