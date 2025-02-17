import { Filter, FilterValue, Project, Risk } from './entities.js';
import { Factory } from '@mikro-orm/seeder';

export class ProjectFactory extends Factory<Project> {

  model = Project;

  definition(): Partial<Project> {
    return {
      name: 'foo',
    };
  }

}

export class RiskFactory extends Factory<Risk> {

  model = Risk;

  definition(): Partial<Risk> {
    return {
      title: 'bar',
    };
  }

}

export class FilterFactory extends Factory<Filter> {

  model = Filter;

  definition(): Partial<Filter> {
    return {
      name: 'baz',
    };
  }

}

export class FilterValueFactory extends Factory<FilterValue> {

  model = FilterValue;

  definition(): Partial<FilterValue> {
    return {
      value: 'lol',
    };
  }

}


