import {
  BeforeUpsert,
  Collection,
  Entity,
  ManyToMany,
  MikroORM,
  PrimaryKey,
  Property,
  sql,
} from '@mikro-orm/sqlite';

@Entity()
class Fruit {

  @PrimaryKey()
  id!: bigint;

  @Property({ unique: true })
  name!: string;

  @Property({ nullable: true })
  description?: string;

  @ManyToMany(() => Bowl, bowl => bowl.fruits)
  bowls = new Collection<Bowl>(this);

  @Property({ default: sql.now() })
  createdAt = new Date();

  @Property({
    default: sql.now(),
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt = new Date();

  @BeforeUpsert()
  private beforeUpsert() {
    this.updatedAt = new Date();
  }

}

@Entity()
class Bowl {

  @PrimaryKey()
  id!: bigint;

  @Property({ unique: true })
  name!: string;

  @Property({ nullable: true })
  description?: string;

  @ManyToMany(() => Fruit)
  fruits = new Collection<Fruit>(this);

  @Property({ default: sql.now() })
  createdAt = new Date();

  @Property({
    default: sql.now(),
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt = new Date();

  @BeforeUpsert()
  private beforeUpsert() {
    this.updatedAt = new Date();
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Bowl, Fruit],
    dbName: `:memory:`,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('5702', async () => {
  for (let i = 0; i < 100; i++) {
    const bowl = new Bowl();
    bowl.name = `Bowl ${i}`;

    for (let j = 0; j < 10; j++) {
      const fruit = new Fruit();
      fruit.name = `Fruit ${i}.${j}`;
      bowl.fruits.add(fruit);
    }

    orm.em.persist(bowl);
  }
  await orm.em.flush();
  orm.em.clear();

  const fruit1 = await orm.em.findOne(Fruit, {
    name: `Fruit 0.0`,
  });

  const fruit2 = await orm.em.upsert(Fruit, {
    name: `Fruit 0.0`,
    description: 'Healthy',
  });

  const [fruit3] = await orm.em.upsertMany(Fruit, [{
    name: `Fruit 0.0`,
    description: 'Healthy',
  }]);

  expect(fruit1).toBe(fruit2);
  expect(fruit1).toBe(fruit3);
});
