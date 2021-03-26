import { Entity, MikroORM, PrimaryKey, Property, IdentifiedReference, LoadStrategy, OneToOne } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class RadioOption {

  @PrimaryKey()
  id!: number;

  @Property()
  enabled!: boolean;

  @Property()
  createdAt: Date = new Date();

  @OneToOne({ entity: 'Radio', wrappedReference: true, mappedBy: 'option' })
  radio!: IdentifiedReference<Radio>;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

}

@Entity()
export class Radio {

  @PrimaryKey()
  id!: number;

  @Property()
  question: string = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);

  @OneToOne({ entity: () => RadioOption, wrappedReference: true, eager: true })
  option!: IdentifiedReference<RadioOption>;

}

describe('GH issue 1592', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: `:memory:`,
      type: 'sqlite',
      entities: [Radio, RadioOption],
      loadStrategy: LoadStrategy.JOINED,
    });
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`em.create property calls constructors of nested entities with Reference wrapper`, async () => {
    const radio = orm.em.create(Radio, {
      question: 'bla bla',
      option: {
        enabled: false,
      },
    });
    expect(radio.option.getEntity().createdAt).toBeDefined();
    await orm.em.persistAndFlush(radio);
  });

});
