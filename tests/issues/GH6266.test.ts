import { DeferMode, MikroORM, ref, Ref } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Dimension {

  @PrimaryKey({ type: 'varchar' })
  id: string;

  @Property()
  name: string;

  @OneToOne(() => Unit, { ref: true, deferMode: DeferMode.INITIALLY_DEFERRED })
  referenceUnit: Ref<Unit>;

  constructor(id: string, name: string, referenceUnit: Ref<Unit>) {
    this.id = id;
    this.name = name;
    this.referenceUnit = referenceUnit;
  }

}

@Entity()
class Unit {

  @PrimaryKey({ type: 'varchar' })
  id: string;

  @Property()
  name: string;

  @ManyToOne(() => Dimension, { ref: true, deferMode: DeferMode.INITIALLY_DEFERRED })
  dimension: Ref<Dimension>;

  @Property({ type: 'float8' })
  conversionFactor: number;

  constructor(id: string, name: string, dimension: Ref<Dimension>, conversionFactor: number) {
    this.id = id;
    this.name = name;
    this.dimension = dimension;
    this.conversionFactor = conversionFactor;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6266',
    entities: [Dimension, Unit],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6266', async () => {
  const dimension = orm.em.create(Dimension, { id: 'MASS', name: 'Mass', referenceUnit: ref(Unit, 'KILOGRAM') });
  orm.em.create(Unit, { id: 'KILOGRAM', name: 'Kilogram', dimension, conversionFactor: 1 });
  orm.em.create(Unit, { id: 'TON', name: 'Ton', dimension, conversionFactor: 1000 });
  orm.em.create(Unit, { id: 'GRAM', name: 'Gram', dimension, conversionFactor: 0.001 });
  await orm.em.flush();
  orm.em.clear();

  const units = await orm.em.findAll(Unit);
  expect(units).toHaveLength(3);
});
