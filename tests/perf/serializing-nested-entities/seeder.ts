import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { FilterFactory, FilterValueFactory, ProjectFactory, RiskFactory } from './factories.js';

export class DatabaseSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    const NUM_FILTER_VALUES = 6;
    const filters = new FilterFactory(em).each(entity => {
      entity.values.set(new FilterValueFactory(em).make(NUM_FILTER_VALUES));
    }).make(5);

    new ProjectFactory(em).makeOne({
      filters,
      risks: new RiskFactory(em).each(risk => {
        risk.filterValues.set(filters.map(filter => filter.values.getItems()[Math.floor(Math.random() * NUM_FILTER_VALUES)]));
      }).make(100),
    });

    await em.flush();
  }

}
