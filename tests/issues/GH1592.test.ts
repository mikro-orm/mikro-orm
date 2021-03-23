import { Entity, MikroORM, PrimaryKey, Property, IdentifiedReference, LoadStrategy, OneToOne } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

@Entity()
export class RadioOption {

  @PrimaryKey()
  id!: number;

  @Property()
  enabled!: boolean;

  @Property()
  createdAt = new Date();

  @OneToOne(() => Radio, radio => radio.option)
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

  @OneToOne(
    {
      eager: true
    }
  )
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
      metadataProvider: TsMorphMetadataProvider
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1553`, async () => {
    const radio = orm.em.create(Radio, {
      question: 'bla bla',
      option: {
        enabled: false
      }
    });

    await orm.em.persistAndFlush(radio);
  });

});
