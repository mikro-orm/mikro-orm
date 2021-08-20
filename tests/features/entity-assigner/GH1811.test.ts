import { Collection, Entity, ManyToMany, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, t, wrap } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';
import { mockLogger } from '../../bootstrap';

@Entity()
export class Recipe {

  @PrimaryKey({ type: t.uuid })
  id: string = v4();

  @Property()
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany({ entity: () => Ingredient, mappedBy: 'recipe', orphanRemoval: true })
  ingredients = new Collection<Ingredient>(this);

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToMany({ entity: () => User })
  authors = new Collection<User>(this);

}

@Entity()
export class Ingredient {

  @PrimaryKey({ type: t.uuid })
  id: string = v4();

  @ManyToOne({ entity: () => Recipe })
  recipe!: Recipe;

  @Property()
  name!: string;

}

@Entity()
export class User {

  @PrimaryKey({ type: t.uuid })
  id: string = v4();

  @Property()
  name!: string;

}

describe('GH issue 1811', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Ingredient, Recipe, User],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.createQueryBuilder(Ingredient).truncate().execute();
    await orm.em.createQueryBuilder(User).truncate().execute();
    await orm.em.createQueryBuilder(Recipe).truncate().execute();
    orm.em.clear();
  });

  async function createRecipe() {
    const recipe = orm.em.create(Recipe, {
      id: '3ea3e69c-c221-41b1-a14e-135ef3141ea3',
      name: 'Salad',
      ingredients: [
        { id: '16e443a7-b527-493f-ab8a-63012514b719', name: 'Spinach' },
        { id: '1d4876ce-01de-4ba8-9d17-3c1c0d56fe73', name: 'Carrot' },
      ],
      authors: [
        { id: '22222222-0000-493f-ab8a-03012514b719', name: 'Alice' },
        { id: '33333333-0000-4ba8-9d17-1c1c0d56fe73', name: 'Bob' },
      ],
    });
    await orm.em.persistAndFlush(recipe);
    orm.em.clear();

    return recipe;
  }

  test('assigning to 1:m with nested entities', async () => {
    const r = await createRecipe();
    const recipe = await orm.em.findOneOrFail(Recipe, r, { populate: ['ingredients'] });

    wrap(recipe).assign({
      ingredients: [
        { id: '16e443a7-b527-493f-ab8a-63012514b719', name: 'Spinach' }, // existing
        { name: 'Onion' }, // new, should be created
        // carrot should be dropped, id: '1d4876ce-01de-4ba8-9d17-3c1c0d56fe73',
      ],
    });
    expect(recipe.ingredients.toArray()).toEqual([
      { id: '16e443a7-b527-493f-ab8a-63012514b719', name: 'Spinach', recipe: recipe.id },
      { id: expect.stringMatching(/[\w-]{36}/), name: 'Onion', recipe: recipe.id },
    ]);

    const mock = mockLogger(orm, ['query']);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `ingredient` (`id`, `name`, `recipe_id`) values (?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('delete from `ingredient` where `id` in (?)');
    expect(mock.mock.calls[3][0]).toMatch('commit');

    const r1 = await orm.em.fork().findOneOrFail(Recipe, recipe, { populate: ['ingredients'] });
    expect(r1.ingredients.toArray()).toEqual([
      { id: '16e443a7-b527-493f-ab8a-63012514b719', name: 'Spinach', recipe: recipe.id },
      { id: expect.stringMatching(/[\w-]{36}/), name: 'Onion', recipe: recipe.id },
    ]);
  });

  test('assigning to m:1 with nested entities', async () => {
    const r = await createRecipe();
    const recipe = await orm.em.findOneOrFail(Recipe, r, { populate: ['ingredients'] });
    const onion = wrap(recipe.ingredients[1]).assign({
      name: 'Onion',
      recipe: { name: 'Scrambled eggs' }, // should create new recipe entity
    });
    const mock = mockLogger(orm, ['query']);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `recipe` (`id`, `name`) values (?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('update `ingredient` set `recipe_id` = ?, `name` = ? where `id` = ?');
    expect(mock.mock.calls[3][0]).toMatch('commit');

    const r2 = await orm.em.fork().find(Recipe, {}, { populate: ['ingredients'] });
    expect(r2.map(r => r.name)).toEqual(['Salad', 'Scrambled eggs']);
    expect(r2[0].ingredients.toArray()).toEqual([
      { id: '16e443a7-b527-493f-ab8a-63012514b719', name: 'Spinach', recipe: recipe.id },
    ]);
    expect(r2[1].ingredients.toArray()).toEqual([
      { id: onion.id, name: 'Onion', recipe: r2[1].id },
    ]);

    wrap(onion).assign({
      name: 'Spring Onion',
      recipe: { id: onion.recipe.id, name: 'Poached eggs' }, // should update existing recipe entity
    });

    mock.mock.calls.length = 0;
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('update `recipe` set `name` = ? where `id` = ?');
    expect(mock.mock.calls[2][0]).toMatch('update `ingredient` set `name` = ? where `id` = ?');
    expect(mock.mock.calls[3][0]).toMatch('commit');

    const r3 = await orm.em.fork().find(Recipe, {}, { populate: ['ingredients'] });
    expect(r3.map(r => r.name)).toEqual(['Salad', 'Poached eggs']);
    expect(r3[0].ingredients.toArray()).toEqual([
      { id: '16e443a7-b527-493f-ab8a-63012514b719', name: 'Spinach', recipe: recipe.id },
    ]);
    expect(r3[1].ingredients.toArray()).toEqual([
      { id: onion.id, name: 'Spring Onion', recipe: r3[1].id },
    ]);
  });

  test('assigning to m:m with nested entities', async () => {
    const r = await createRecipe();
    const recipe = await orm.em.findOneOrFail(Recipe, r, { populate: ['authors'] });

    wrap(recipe).assign({
      authors: [
        { id: '22222222-0000-493f-ab8a-03012514b719', name: 'Malice' }, // existing
        { name: 'Tom' }, // new, should be created
        // Bob should be dropped
      ],
    });
    expect(recipe.authors.toArray()).toEqual([
      { id: '22222222-0000-493f-ab8a-03012514b719', name: 'Malice' },
      { id: expect.stringMatching(/[\w-]{36}/), name: 'Tom' },
    ]);

    const mock = mockLogger(orm, ['query']);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `user` (`id`, `name`) values (?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('update `user` set `name` = ? where `id` = ?');
    expect(mock.mock.calls[3][0]).toMatch('delete from `recipe_authors` where (`user_id`) in ( values (?)) and `recipe_id` = ?');
    expect(mock.mock.calls[4][0]).toMatch('insert into `recipe_authors` (`recipe_id`, `user_id`) values (?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('commit');

    const r1 = await orm.em.fork().findOneOrFail(Recipe, recipe, { populate: ['authors'], orderBy: { authors: { name: 'asc' } } });
    expect(r1.authors.toArray()).toEqual([
      { id: '22222222-0000-493f-ab8a-03012514b719', name: 'Malice' },
      { id: expect.stringMatching(/[\w-]{36}/), name: 'Tom' },
    ]);
  });

});
