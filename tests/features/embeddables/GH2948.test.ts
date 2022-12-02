import { Embeddable, Embedded, Entity, ManyToOne, MikroORM, PrimaryKey, Property, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Embeddable()
export class Fiz {

  constructor(name: string, baz: any) {
    this.name = name;
    this._baz = baz;
  }

  @Property()
  name: string;

  @ManyToOne({ entity: () => BazEntity, eager: true })
  _baz: any;

}

@Embeddable()
export class Bar {

  constructor(name: string, fiz: Fiz[]) {
    this.name = name;
    this._fiz = fiz;
  }

  @Property()
  name: string;

  @Embedded(() => Fiz, { array: true })
  _fiz: Fiz[] = [];

}

@Entity()
export class BazEntity {

  constructor(name: string) {
    this.name = name;
  }

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

}

@Entity()
export class FooEntity {

  constructor(bar: Bar[]) {
    this._bar = bar;
  }

  @PrimaryKey()
  id!: number;

  @Embedded(() => Bar, { array: true })
  _bar: Bar[] = [];

}

function removeUnderscorePrefix(value: string): string {
  const [firstChar, ...theRest] = value;
  const newValue = theRest.join('');
  return firstChar === '_' ? newValue : value;
}

export class CustomNamingStrategy extends UnderscoreNamingStrategy {

  joinColumnName(propertyName: string): string {
    return removeUnderscorePrefix(super.joinColumnName(propertyName));
  }

  joinKeyColumnName(entityName: string, referencedColumnName?: string): string {
    return removeUnderscorePrefix(super.joinKeyColumnName(entityName, referencedColumnName));
  }

  propertyToColumnName(propertyName: string): string {
    return removeUnderscorePrefix(super.propertyToColumnName(propertyName));
  }

  referenceColumnName(): string {
    return removeUnderscorePrefix(super.referenceColumnName());
  }

}

describe('GH issue 2948', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [FooEntity],
      dbName: ':memory:',
      driver: SqliteDriver,
      namingStrategy: CustomNamingStrategy,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 2948`, async () => {
    const foo = new FooEntity([
      new Bar('bar1', [
        new Fiz('fiz-1-1', new BazEntity('baz-1-1-1')),
        new Fiz('fiz-1-2', new BazEntity('baz-1-2-1')),
      ]),
      new Bar('bar2', [
        new Fiz('fiz-2-1', new BazEntity('baz-2-1-1')),
        new Fiz('fiz-2-2', new BazEntity('baz-2-2-1')),
      ]),
    ]);
    await orm.em.fork().persist(foo).flush();

    const [foo2] = await orm.em.find(FooEntity, {}, { populate: true });
    expect(foo2._bar[0]._fiz[0]._baz.name).toBeDefined();
    expect(foo2._bar[0]._fiz[1]._baz.name).toBeDefined();
    expect(foo2._bar[1]._fiz[0]._baz.name).toBeDefined();
    await expect(foo2._bar[1]._fiz[1]._baz.name).toBeDefined();
    orm.em.clear();

    const [foo1] = await orm.em.find(FooEntity, {}, { populate: ['_bar._fiz._baz'] });
    expect(foo1._bar[0]._fiz[0]._baz.name).toBeDefined();
    expect(foo1._bar[0]._fiz[1]._baz.name).toBeDefined();
    expect(foo1._bar[1]._fiz[0]._baz.name).toBeDefined();
    await expect(foo1._bar[1]._fiz[1]._baz.name).toBeDefined();
  });

});
