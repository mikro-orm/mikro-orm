import {
  Entity,
  ManyToOne,
  MikroORM,
  OneToOne,
  PrimaryKey,
  Property, ref,
  Ref,
} from '@mikro-orm/postgresql';

@Entity()
class Dimension {

  @PrimaryKey({ type: 'int', autoincrement: true })
  id?: number;

  @Property()
  name: string;

  // necessary to make it nullable
  @OneToOne(() => Unit, { ref: true, nullable: true })
  referenceUnit: Ref<Unit>;

  constructor(name: string, referenceUnit: Ref<Unit>) {
    this.name = name;
    this.referenceUnit = referenceUnit;
  }

  public static create({ name, referenceUnitName }: {name: string; referenceUnitName: string}): {
    dimension: Dimension;
    referenceUnit: Unit;
  } {
    const dimension = new Dimension(name, null!);
    const referenceUnit = new Unit(referenceUnitName, ref(dimension), 1);
    dimension.referenceUnit = ref(referenceUnit);
    return { dimension, referenceUnit };
  }

}

@Entity()
class Unit {

  @PrimaryKey({ type: 'int', autoincrement: true })
  id?:  number;

  @Property()
  name: string;

  @ManyToOne(() => Dimension, { ref: true })
  dimension: Ref<Dimension>;

  @Property({ type: 'float8' })
  conversionFactor: number;

  constructor(name: string, dimension: Ref<Dimension>, conversionFactor: number) {
    this.name = name;
    this.dimension = dimension;
    this.conversionFactor = conversionFactor;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6266-variation-with-auto-increment-id',
    entities: [Dimension, Unit],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6266', async () => {
  const { dimension, referenceUnit } = Dimension.create({
    name: 'Mass',
    referenceUnitName: 'Kilogram',
  });
  orm.em.persist([dimension, referenceUnit]);
  orm.em.create(Unit, { name: 'Ton', dimension, conversionFactor: 1000 });
  orm.em.create(Unit, { name: 'Gram', dimension, conversionFactor: 0.001 });
  await orm.em.flush();
  orm.em.clear();

  const units = await orm.em.findAll(Unit);
  const loadedDimension = await orm.em.findOneOrFail(Dimension, { name: 'Mass' }, { populate: ['referenceUnit'] });
  expect(units).toHaveLength(3);
  // works here
  expect(dimension.referenceUnit.id).toBeDefined();
  // fails here
  expect(loadedDimension.referenceUnit.id).toBeDefined();
  for (const unit of units) {
    expect(unit.dimension.id).toBeDefined();
  }
});
