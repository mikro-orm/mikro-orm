import { Entity, IdentifiedReference, ManyToOne, MikroORM, PrimaryKey, Reference } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';


@Entity()
export class First {

  @PrimaryKey()
  id!: number;

}

@Entity()
export class Second {

  @PrimaryKey()
  id!: number;

}

@Entity()
export class Third {

  @ManyToOne({ primary: true, entity: () => First })
  first: IdentifiedReference<First>;

  @ManyToOne({ primary: true, entity: () => Second })
  second: IdentifiedReference<Second>;

  constructor(first: First, second: Second) {
    this.first = Reference.create(first);
    this.second = Reference.create(second);
  }

}

describe('GH issue 2148', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [First, Second, Third],
      dbName: 'mikro_orm_test_2148',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('persisting composite PK entity with reference wrapper', async () => {
    const a = new First();
    const b = new Second();
    const c = new Third(a, b);
    await orm.em.persistAndFlush(c);
    orm.em.clear();

    const cc = await orm.em.findOneOrFail(Third, {
      first: a.id,
      second: b.id,
    });
    await orm.em.remove(cc).flush();
  });

});
