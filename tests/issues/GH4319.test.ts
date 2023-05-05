import { Collection, Entity, ManyToOne, OneToMany, BigIntType, PrimaryKey, Ref, MikroORM } from '@mikro-orm/core';

@Entity()
class Company {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @OneToMany(() => Rule, r => r.company)
  rules = new Collection<Rule>(this);

}

@Entity()
class Rule {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @ManyToOne(() => Company, {
    ref: true,
  })
  company!: Ref<Company>;

}

@Entity()
export class Service {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @OneToMany(() => ServicePropertyMikro, property => property.performable)
  properties = new Collection<ServicePropertyMikro>(this);

  @ManyToOne(() => Company, {
    ref: true,
  })
  vendor!: Ref<Company>;

}

@Entity()
class ServicePropertyMikro {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @ManyToOne(() => Service, {
    ref: true,
    inversedBy: service => service.properties,
  })
  performable!: Ref<Service>;

  @OneToMany(() => ServicePropertyConditionMikro, spc => spc.property)
  conditions = new Collection<ServicePropertyConditionMikro>(this);

}

@Entity()
class ServicePropertyConditionMikro {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @ManyToOne(() => ServicePropertyMikro, {
    ref: true,
  })
  property!: Ref<ServicePropertyMikro>;

}

let orm: MikroORM;
let service: Service;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [
      Service,
      Company,
      Rule,
      ServicePropertyMikro,
      ServicePropertyConditionMikro,
    ],
    persistOnCreate: true,
  });
  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();

  const fork = orm.em.fork();

  const vendor = fork.create(Company, {});

  service = fork.create(Service, { vendor });

  fork.create(ServicePropertyMikro, { performable: service });

  await fork.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test(`populating properties across two promises causes conflict`, async () => {
  await Promise.all([
    orm.em
      .findOneOrFail(
        Service,
        { id: service.id },
        { populate: ['vendor.rules'] },
      )
      .then(async performable => {
        const properties = await performable.properties.load({
          populate: ['conditions'],
        });

        properties.getItems().map(f => f.conditions.getItems().map(c => c));
      }),
    orm.em.findOneOrFail(Service, service.id, {
      populate: ['properties'],
    }),
  ]);
});

test(`remove properties from second promise causes no issue`, async () => {
  await Promise.all([
    orm.em
      .findOneOrFail(
        Service,
        { id: service.id },
        { populate: ['vendor.rules'] },
      )
      .then(async performable => {
        const properties = await performable.properties.load({
          populate: ['conditions'],
        });

        properties.getItems().map(f => f.conditions.getItems().map(c => c));
      }),
    orm.em.findOneOrFail(Service, service.id, {
      populate: [],
    }),
  ]);
});

test(`remove rules from first promise causes no issue`, async () => {
  await Promise.all([
    orm.em
      .findOneOrFail(Service, { id: service.id }, { populate: ['vendor'] })
      .then(async performable => {
        const properties = await performable.properties.load({
          populate: ['conditions'],
        });

        properties.getItems().map(f => f.conditions.getItems().map(c => c));
      }),
    orm.em.findOneOrFail(Service, service.id, {
      populate: ['properties'],
    }),
  ]);
});
