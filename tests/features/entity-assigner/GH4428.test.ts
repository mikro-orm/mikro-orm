import { Entity, JsonType, PrimaryKey, Property, Utils, wrap } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

type UnitOfMeasure = 'pcs' | 'gram';

interface Ingredient {
  name: string;
  quantity: {
    units: number;
    uom: UnitOfMeasure;
  };
}

enum CookingDevice {
  OVEN = 'Oven',
  MICRO = 'Microwave'
}

type CookingInstructions = {
  [device in CookingDevice]?: {
    degrees: number;
    time: number;
  }
};

interface Instructions {
  ingredients: Ingredient[];
  cooking: CookingInstructions;
  notes?: string;
}

@Entity()
class Recipe {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: JsonType })
  instructions!: Instructions;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Recipe],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH 4428: issue updating nested props`, async () => {
  const e = orm.em.create(Recipe, {
    id: 1,
    name: 'Pizza',
    instructions: {
      ingredients: [
        {
          name: 'Tomato',
          quantity: {
            units: 1,
            uom: 'pcs',
          },
        },
        {
          name: 'Salami',
          quantity: {
            units: 2,
            uom: 'pcs',
          },
        },
        {
          name: 'Cheese',
          quantity: {
            units: 1,
            uom: 'pcs',
          },
        },
      ],
      cooking: {
        Oven : {
          degrees: 200,
          time: 12,
        },
        Microwave: {
          degrees: 180,
          time: 15,
        },
      },
      notes: 'do not cook it too long',
    },
  });
  await orm.em.persistAndFlush(e);

  const e1 = await orm.em.findOneOrFail(Recipe, 1);
  const updatedRecipe: Recipe = {
    id: 1,
    name: 'Pizza',
    instructions: {
      ingredients: [
        {
          name: 'Tomato',
          quantity: {
            units: 1,
            uom: 'pcs',
          },
        },
        {
          name: 'Salami',
          quantity: {
            units: 2,
            uom: 'pcs',
          },
        },
        {
          name: 'Cheese',
          quantity: {
            units: 100,
            uom: 'gram',
          },
        },
      ],
      cooking: {
        Oven : {
          degrees: 200,
          time: 12,
        },
        Microwave: undefined,
      },
      // test only succeeds when providing null, or omitting the next prop
      notes: undefined,
    },
  };
  wrap(e1).assign(updatedRecipe);

  await orm.em.flush();

  const reloadedRecipe = await orm.em.fork().findOneOrFail(Recipe, 1);
  const finalRecipe = wrap(reloadedRecipe).toObject();

  Utils.dropUndefinedProperties(updatedRecipe);
  expect(finalRecipe).toMatchObject(updatedRecipe);
});

test(`GH 4428: issue updating nested props directly`, async () => {
  const e = orm.em.create(Recipe, {
    id: 1,
    name: 'Pizza',
    instructions: {
      ingredients: [
        {
          name: 'Tomato',
          quantity: {
            units: 1,
            uom: 'pcs',
          },
        },
        {
          name: 'Salami',
          quantity: {
            units: 2,
            uom: 'pcs',
          },
        },
        {
          name: 'Cheese',
          quantity: {
            units: 1,
            uom: 'pcs',
          },
        },
      ],
      cooking: {
        Oven : {
          degrees: 200,
          time: 12,
        },
        Microwave: {
          degrees: 180,
          time: 15,
        },
      },
      notes: 'do not cook it too long',
    },
  });
  await orm.em.persistAndFlush(e);

  const e1 = await orm.em.findOneOrFail(Recipe, 1);
  const updatedRecipe: Recipe = {
    id: 1,
    name: 'Pizza',
    instructions: {
      ingredients: [
        {
          name: 'Tomato',
          quantity: {
            units: 1,
            uom: 'pcs',
          },
        },
        {
          name: 'Salami',
          quantity: {
            units: 2,
            uom: 'pcs',
          },
        },
        {
          name: 'Cheese',
          quantity: {
            units: 100,
            uom: 'gram',
          },
        },
      ],
      cooking: {
        Oven : {
          degrees: 200,
          time: 12,
        },
      },
    },
  };
  e1.instructions.ingredients[2].quantity = {
    units: 100,
    uom: 'gram',
  };
  e1.instructions.notes = undefined;

  await orm.em.flush();

  const reloadedRecipe = await orm.em.fork().findOneOrFail(Recipe, 1);
  const finalRecipe = wrap(reloadedRecipe).toObject();

  expect(finalRecipe).toMatchObject(updatedRecipe);
});
