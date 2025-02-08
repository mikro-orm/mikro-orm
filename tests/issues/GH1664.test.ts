import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers';

@Entity()
class MultipleUniqueNullableProperties {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true, nullable: true })
  first?: string;

  @Property({ unique: true, nullable: true })
  second?: string;

  constructor(first?: string, second?: string) {
    this.first = first;
    this.second = second;
  }

}

describe('embedded entities in postgresql', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [MultipleUniqueNullableProperties],
      dbName: 'mikro_orm_test_unique_nullable_insert',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('persist and load single item', async () => {
    const e1 = new MultipleUniqueNullableProperties('a', 'b');

    const mock = mockLogger(orm, ['query']);

    await orm.em.persistAndFlush(e1);

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into "multiple_unique_nullable_properties" ("first", "second") values (?, ?) returning "id"');
    expect(mock.mock.calls[2][0]).toMatch('commit');
    mock.mock.calls.length = 0;

    e1.first = 'c';
    e1.second = 'd';
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('update "multiple_unique_nullable_properties" set "first" = ?, "second" = ? where "id" = ?');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('persist and load multiple items', async () => {
    const e1 = new MultipleUniqueNullableProperties('a1', 'b1');
    const e2 = new MultipleUniqueNullableProperties('a2', 'b2');

    const mock = mockLogger(orm, ['query']);

    await orm.em.persistAndFlush([e1, e2]);

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into "multiple_unique_nullable_properties" ("first", "second") values (?, ?), (?, ?) returning "id"');
    expect(mock.mock.calls[2][0]).toMatch('commit');
    mock.mock.calls.length = 0;

    e1.first = 'c1';
    e1.second = 'd1';
    e2.first = 'c2';
    e2.second = 'd2';
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('update "multiple_unique_nullable_properties" set "first" = ?, "second" = ? where "id" = ?');
    expect(mock.mock.calls[2][0]).toMatch('update "multiple_unique_nullable_properties" set "first" = ?, "second" = ? where "id" = ?');
    expect(mock.mock.calls[3][0]).toMatch('commit');
  });

});
