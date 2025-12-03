import { Collection, IDatabaseDriver, MikroORM } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MsSqlDriver } from '@mikro-orm/mssql';

@Entity()
class Recipe {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @Property({
    onCreate: () => new Date(),
    columnType: 'datetime',
  })
  createdAt!: Date;

  @OneToMany(() => Ingredient, ingredient => ingredient.recipe)
  ingredients = new Collection<Ingredient>(this);

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
class Ingredient {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  quantity: number;

  @Property({
    onCreate: () => new Date(),
    columnType: 'datetime',
  })
  createdAt!: Date;

  @ManyToOne(() => Recipe)
  recipe!: Recipe;

  constructor(name: string, quantity: number) {
    this.name = name;
    this.quantity = quantity;
  }

}

const options = {
  mysql: {
    driver: MySqlDriver,
    port: 3308,
  },
  mssql: {
    driver: MsSqlDriver,
    password:  'Root.Root',
  },
} as const;

describe.each(['mysql', 'mssql'] as const)('%s', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      metadataProvider: ReflectMetadataProvider,
      ...options[type],
      entities: [Recipe, Ingredient],
      dbName: '5577',
      timezone: '+05:00',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('5577', async () => {
    const r = new Recipe('My first recipe');
    r.ingredients.add(new Ingredient('Flour', 500));
    r.ingredients.add(new Ingredient('Sugar', 200));
    r.ingredients.add(new Ingredient('Milk', 200));
    orm.em.persist(r);
    await orm.em.flush();

    const recipe = await orm.em.fork().findOneOrFail(
      Recipe,
      { title: 'My first recipe' },
      { populate: ['ingredients'] },
    );

    const withPopulate = recipe.ingredients
      .getItems()
      .find(x => x.name === 'Flour');

    const ingredients = await orm.em.fork().find(
      Ingredient,
      {
        recipe: { id: recipe.id },
      },
    );

    const withoutPopulate = ingredients.find(x => x.name === 'Flour');
    expect(withPopulate?.createdAt).toEqual(withoutPopulate?.createdAt);
  });
});
