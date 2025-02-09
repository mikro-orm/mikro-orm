import { v4 } from 'uuid';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  MikroORM,
  SimpleLogger,
  Filter,
  Collection,
  OneToMany,
  Enum,
  ManyToOne,
  Rel, wrap,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

enum EntityState {
  AVAILABLE = 'Available',
  DELETED = 'Deleted',
}

@Filter({
  name: 'valid',
  cond: { entityState: EntityState.AVAILABLE },
  default: true,
})
abstract class BaseEntity {

  @PrimaryKey()
  id: string = v4();

  @Enum({ items: () => EntityState, nullable: true })
  entityState?: EntityState = EntityState.AVAILABLE;

}

@Entity()
class Clinic extends BaseEntity {

  @OneToMany(() => Drug, d => d.clinic)
  drugs = new Collection<Drug>(this);

}

@Embeddable()
class DrugInfoIngredient {

  @Property({ type: 'number', columnType: 'numeric(10,2)' })
  quantity!: number;

  @ManyToOne(() => Ingredient)
  ingredient!: Rel<Ingredient>;

}

@Entity()
class DrugInfo extends BaseEntity {

  @PrimaryKey()
  id: string = v4();

  @Embedded(() => DrugInfoIngredient, { array: true })
  drugInfoIngredients?: DrugInfoIngredient[] = [];

  @OneToMany(() => Drug, drug => drug.drugInfo, { nullable: true })
  drugs = new Collection<Drug>(this);

  @ManyToOne(() => Clinic, { nullable: true })
  clinic?: Clinic;

}

@Entity()
class Drug extends BaseEntity {

  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => DrugInfo)
  drugInfo!: Rel<DrugInfo>;

  @ManyToOne(() => Clinic)
  clinic!: Rel<Clinic>;

}

@Entity()
class Ingredient extends BaseEntity {

  @PrimaryKey()
  id: string = v4();

  @Property()
  name!: string;

  @ManyToOne(() => Clinic, { nullable: true })
  clinic?: Clinic;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Drug, Ingredient],
    dbName: ':memory:',
    autoJoinRefsForFilters: false,
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close();
});

test('5325', async () => {
  const mock = mockLogger(orm);
  orm.em.create(Drug, {
    id: 'd1',
    clinic: { id: 'c1', entityState: EntityState.AVAILABLE },
    drugInfo: {
      id: 'di1',
      entityState: EntityState.AVAILABLE,
      clinic: { id: 'c1' },
      drugInfoIngredients: [
        { quantity: 1, ingredient: { id: '11', clinic: { id: 'c1' }, entityState: EntityState.AVAILABLE, name: 'i11' } },
        { quantity: 5, ingredient: { id: '22', clinic: { id: 'c1' }, entityState: EntityState.AVAILABLE, name: 'i22' } },
      ],
    },
  });
  await orm.em.flush();
  orm.em.clear();

  const [res] = await orm.em.findAll(Drug, {
    populate: ['drugInfo.drugInfoIngredients.ingredient'],
  });
  expect(wrap(res).toObject()).toMatchObject({
    id: 'd1',
    clinic: 'c1',
    entityState: 'Available',
    drugInfo: {
      id: 'di1',
      entityState: 'Available',
      drugInfoIngredients: [
        {
          ingredient: {
            clinic: 'c1',
            entityState: 'Available',
            id: '11',
            name: 'i11',
          },
          quantity: 1,
        },
        {
          ingredient: {
            clinic: 'c1',
            entityState: 'Available',
            id: '22',
            name: 'i22',
          },
          quantity: 5,
        },
      ],
    },
  });
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ["[query] insert into `clinic` (`id`, `entity_state`) values ('c1', 'Available')"],
    ["[query] insert into `ingredient` (`id`, `entity_state`, `name`, `clinic_id`) values ('11', 'Available', 'i11', 'c1'), ('22', 'Available', 'i22', 'c1')"],
    ["[query] insert into `drug_info` (`id`, `entity_state`, `drug_info_ingredients`, `clinic_id`) values ('di1', 'Available', '[{\"quantity\":1,\"ingredient_id\":\"11\"},{\"quantity\":5,\"ingredient_id\":\"22\"}]', 'c1')"],
    ["[query] insert into `drug` (`id`, `entity_state`, `drug_info_id`, `clinic_id`) values ('d1', 'Available', 'di1', 'c1')"],
    ['[query] commit'],
    ['[query] select `d0`.*, `d1`.`id` as `d1__id`, `d1`.`entity_state` as `d1__entity_state`, `d1`.`drug_info_ingredients` as `d1__drug_info_ingredients`, `d1`.`clinic_id` as `d1__clinic_id` ' +
    'from `drug` as `d0` ' +
    "left join `drug_info` as `d1` on `d0`.`drug_info_id` = `d1`.`id` and `d1`.`entity_state` = 'Available' left join `ingredient` as `i2` on json_extract(`d1`.`drug_info_ingredients`, '$.ingredient_id') = `i2`.`id` and `i2`.`entity_state` = 'Available' " +
    'where `d0`.`entity_state` = \'Available\''],
    ["[query] select `i0`.* from `ingredient` as `i0` where `i0`.`entity_state` = 'Available' and `i0`.`id` in ('11', '22')"],
  ]);
});
