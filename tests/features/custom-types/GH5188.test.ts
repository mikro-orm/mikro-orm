import {
  ArrayType,
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

interface CalendarDate {
  date: string;
}

class CalendarDateArrayType extends ArrayType<CalendarDate> {

  constructor() {
    super(
      date => ({ date }),
      d => d.date,
    );
  }

  getColumnType(): string {
    return 'date[]';
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ type: CalendarDateArrayType })
  favoriteDays!: CalendarDate[];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: '5188',
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('array of date is not converted to array of Date objects', async () => {
  const mock = mockLogger(orm);

  const u = orm.em.create(User, {
    favoriteDays: [
      { date: '1990-03-23' },
      { date: '2023-03-23' },
    ],
  });
  await orm.em.persistAndFlush(u);
  orm.em.clear();

  const u2 = await orm.em.findOneOrFail(User, { favoriteDays: { $contains: [{ date: '2023-03-23' }] } });
  expect(u2.favoriteDays).toEqual([
    { date: '1990-03-23' },
    { date: '2023-03-23' },
  ]);
  u2.favoriteDays[1].date = '1234-01-01';
  await orm.em.flush();

  expect(mock.mock.calls[0][0]).toMatch(`begin`);
  expect(mock.mock.calls[1][0]).toMatch(`insert into "user" ("favorite_days") values ('{1990-03-23,2023-03-23}') returning "id"`);
  expect(mock.mock.calls[2][0]).toMatch(`commit`);
  expect(mock.mock.calls[3][0]).toMatch(`select "u0".* from "user" as "u0" where "u0"."favorite_days" @> '{2023-03-23}' limit 1`);
  expect(mock.mock.calls[4][0]).toMatch(`begin`);
  expect(mock.mock.calls[5][0]).toMatch(`update "user" set "favorite_days" = '{1990-03-23,1234-01-01}' where "id" = 1`);
  expect(mock.mock.calls[6][0]).toMatch(`commit`);
});
