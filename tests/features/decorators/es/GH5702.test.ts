import { Collection, MikroORM, sql } from '@mikro-orm/sqlite';
import { AfterUpsert, BeforeUpsert, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity()
class Fruit {

  @PrimaryKey({ type: 'bigint' })
  id!: bigint;

  @Property({ type: 'string', unique: true })
  name!: string;

  @Property({ type: 'string', nullable: true })
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

  @PrimaryKey({ type: 'bigint' })
  id!: bigint;

  @Property({ type: 'string', unique: true })
  name!: string;

  @Property({ type: 'string', nullable: true })
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

  @AfterUpsert()
  private afterUpsert() {
    //
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [Bowl, Fruit],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
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
