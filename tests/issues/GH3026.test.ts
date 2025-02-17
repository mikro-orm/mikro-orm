import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, wrap } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
class Ingredient {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany('RecipeIngredient', 'ingredient')
  recipeIngredients = new Collection<RecipeIngredient>(this);

}

@Entity()
class Recipe {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany('RecipeIngredient', 'recipe', { eager: true, orphanRemoval: true })
  ingredients = new Collection<RecipeIngredient>(this);

}

@Entity()
class RecipeIngredient {

  @PrimaryKey()
  id!: number;

  @Property()
  quantity!: number;

  @ManyToOne(() => Ingredient, { eager: true })
  ingredient!: Ingredient;

  @ManyToOne(() => Recipe)
  recipe!: Recipe;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Ingredient, Recipe, RecipeIngredient],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3026`, async () => {
  const ingredients = [
    { id: 1, name: 'Tomato' },
    { id: 2, name: 'Cheese' },
    { id: 3, name: 'Basil' },
  ];

  for (const data of ingredients) {
    orm.em.create(Ingredient, data, { persist: true });
  }

  await orm.em.flush();

  const recipe = {
    id: 1,
    name: 'Pizza',
    ingredients: [
      {
        id: 1,
        quantity: 4,
        ingredient: ingredients[0],
      },
    ],
  };

  const e = orm.em.create(Recipe, recipe);
  await orm.em.persistAndFlush(e);

  const updatedRecipe = {
    id: 1,
    name: 'Pizza',
    ingredients: [
      {
        id: 1,
        quantity: 2,
        ingredient: ingredients[1],
      },
    ],
  };

  const e1 = await orm.em.findOneOrFail(Recipe, updatedRecipe.id!);
  wrap(e1).assign(updatedRecipe);

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).toHaveBeenCalledTimes(3);
  expect(mock.mock.calls[1][0]).toMatch('update `recipe_ingredient` set `quantity` = 2, `ingredient_id` = 2 where `id` = 1');

  const reloadedRecipe = await orm.em.fork().findOneOrFail(Recipe, 1);
  const finalRecipe = wrap(reloadedRecipe).toObject();

  expect(finalRecipe).toMatchObject(updatedRecipe);
});
