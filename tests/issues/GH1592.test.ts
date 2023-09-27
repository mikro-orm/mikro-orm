import { Entity, MikroORM, PrimaryKey, Property, Ref, LoadStrategy, OneToOne, OptionalProps } from '@mikro-orm/sqlite';

@Entity()
export class RadioOption {

  [OptionalProps]?: 'createdAt';

  @PrimaryKey()
  id!: number;

  @Property()
  enabled!: boolean;

  @Property()
  createdAt: Date = new Date();

  @OneToOne({ entity: 'Radio', ref: true, mappedBy: 'option' })
  radio!: Ref<Radio>;

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

  @OneToOne({ entity: () => RadioOption, ref: true, eager: true })
  option!: Ref<RadioOption>;

}

describe('GH issue 1592', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: `:memory:`,
      entities: [Radio, RadioOption],
      loadStrategy: LoadStrategy.JOINED,
    });
    await orm.schema.createSchema();
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
