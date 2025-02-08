import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers';

@Entity()
export class A {

  @PrimaryKey({ name: 'ID' })
  id!: number;

  @Property({ name: 'NAME' })
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

describe('GH issue 1595', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: 'mikro_orm_test_gh_1595',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('mapping PKs from batch insert with custom field name', async () => {
    const mock = mockLogger(orm, ['query']);

    const items: A[] = [];

    for (let i = 1; i <= 5; i++) {
      items.push(new A(`a${i}`));
    }

    await orm.em.persistAndFlush(items);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into "a" ("NAME") values (?), (?), (?), (?), (?) returning "ID"');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    items.forEach(item => item.name += ' changed');
    await orm.em.flush();
    expect(mock.mock.calls[3][0]).toMatch('begin');
    expect(mock.mock.calls[4][0]).toMatch('update "a" set "NAME" = case when ("ID" = ?) then ? when ("ID" = ?) then ? when ("ID" = ?) then ? when ("ID" = ?) then ? when ("ID" = ?) then ? else "NAME" end where "ID" in (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('commit');

    items.forEach(item => orm.em.remove(item));
    await orm.em.flush();
    expect(mock.mock.calls[6][0]).toMatch('begin');
    expect(mock.mock.calls[7][0]).toMatch('delete from "a" where "ID" in (?, ?, ?, ?, ?)');
    expect(mock.mock.calls[8][0]).toMatch('commit');
  });

});
