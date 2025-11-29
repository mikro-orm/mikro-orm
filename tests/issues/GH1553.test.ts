import { MikroORM, Ref, Collection, LoadStrategy } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
export class Owner {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne('Radio', { ref: true })
  radio!: Ref<Radio>;

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

  @ManyToOne('Radio', { ref: true })
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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Radio, RadioOption, Owner],
      loadStrategy: LoadStrategy.JOINED,
    });
    await orm.schema.createSchema();
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
