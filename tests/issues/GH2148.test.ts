import { Entity, Ref, ManyToOne, MikroORM, PrimaryKey, Reference } from '@mikro-orm/postgresql';

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

  @ManyToOne({ primary: true, entity: () => First, wrappedReference: true })
  first: Ref<First>;

  @ManyToOne({ primary: true, entity: () => Second, wrappedReference: true })
  second: Ref<Second>;

  constructor(first: First, second: Second) {
    this.first = Reference.create(first);
    this.second = Reference.create(second);
  }

}

describe('GH issue 2148', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [First, Second, Third],
      dbName: 'mikro_orm_test_2148',
    });
    await orm.schema.refreshDatabase();
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
