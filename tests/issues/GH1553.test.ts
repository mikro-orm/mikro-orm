import {
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
  ManyToOne,
  IdentifiedReference,
  OneToMany,
  Collection,
  LoadStrategy,
} from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { SchemaGenerator } from '@mikro-orm/sqlite';

@Entity()
export class Owner {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne('Radio', { wrappedReference: true })
  radio!: IdentifiedReference<Radio>;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
export class RadioOption {

  @PrimaryKey()
  id!: number;

  @Property()
  enabled!: boolean;

  @ManyToOne('Radio', { wrappedReference: true })
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

  @OneToMany(
    () => RadioOption,
    option => option.radio,
    {
      eager: true,
    },
  )
  options = new Collection<RadioOption>(this);

  @OneToMany(
    () => Owner,
    option => option.radio,
    {
      eager: true,
    },
  )
  owners = new Collection<Owner>(this);

}

describe('GH issue 1553', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [Radio, RadioOption, Owner],
      loadStrategy: LoadStrategy.JOINED,
    });
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1553`, async () => {
    const radio = new Radio();
    const owner1 = new Owner('Peter');
    const owner2 = new Owner('Annie');
    const radioOption1 = new RadioOption(true);
    const radioOption2 = new RadioOption(false);
    radio.options.add(radioOption1, radioOption2);
    radio.owners.add(owner1, owner2);
    await orm.em.persistAndFlush(radio);
    orm.em.clear();

    const fetchedRadio1 = await orm.em.findOneOrFail(Radio, radio.id);
    expect(fetchedRadio1.options.getItems()[0].enabled).toBe(true);
    orm.em.clear();

    const fetchedRadio2 = await orm.em.findOneOrFail(Radio, radio.id, { populate: ['owners'] });
    expect(fetchedRadio2.options.getItems()[0].enabled).toBe(true);
  });

});
