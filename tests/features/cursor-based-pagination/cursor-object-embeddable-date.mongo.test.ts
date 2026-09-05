import { Cursor } from '@mikro-orm/core';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MikroORM, ObjectId } from '@mikro-orm/mongodb';

@Embeddable()
class Audit {
  @Property()
  changedAt!: Date;
}

@Entity()
class Job {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  seq!: number;

  @Embedded(() => Audit, { object: true })
  audit!: Audit;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Job],
    dbName: 'mikro_orm_cursor_embedded_date',
  });
  await orm.schema.clear();

  for (let i = 1; i <= 9; i++) {
    orm.em.create(Job, {
      seq: i,
      audit: { changedAt: new Date(Date.UTC(2023, 0, i)) },
    });
  }

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('cursor pagination ordered by date inside object embeddable (string cursor)', async () => {
  const orderBy = { audit: { changedAt: 'asc' }, seq: 'asc' } as const;
  const page1 = await orm.em.findByCursor(Job, { first: 3, orderBy });
  expect(page1).toBeInstanceOf(Cursor);
  expect(page1.items.map(j => j.seq)).toEqual([1, 2, 3]);
  expect(page1.hasNextPage).toBe(true);
  orm.em.clear();

  const page2 = await orm.em.findByCursor(Job, { first: 3, after: page1.endCursor!, orderBy });
  expect(page2.items.map(j => j.seq)).toEqual([4, 5, 6]);
  expect(page2.hasNextPage).toBe(true);
  orm.em.clear();

  const page3 = await orm.em.findByCursor(Job, { first: 3, after: page2.endCursor!, orderBy });
  expect(page3.items.map(j => j.seq)).toEqual([7, 8, 9]);
  expect(page3.hasNextPage).toBe(false);
});

test('cursor pagination ordered by date inside object embeddable (POJO cursor)', async () => {
  const cursor = await orm.em.findByCursor(Job, {
    first: 3,
    after: { audit: { changedAt: new Date(Date.UTC(2023, 0, 3)) }, seq: 3 },
    orderBy: { audit: { changedAt: 'asc' }, seq: 'asc' },
  });
  expect(cursor.items.map(j => j.seq)).toEqual([4, 5, 6]);
});
