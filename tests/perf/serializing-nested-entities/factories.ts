import { Filter, FilterValue, Project, Risk } from './entities';
import { Factory, Faker } from '@mikro-orm/seeder';

export class ProjectFactory extends Factory<Project> {

  model = Project;

  definition(faker: Faker): Partial<Project> {
    return {
      name: faker.company.name(),
    };
  }

}

export class RiskFactory extends Factory<Risk> {

  model = Risk;

  definition(faker: Faker): Partial<Risk> {
    return {
      title: faker.internet.domainWord(),
    };
  }

}

export class FilterFactory extends Factory<Filter> {

  model = Filter;

  definition(faker: Faker): Partial<Filter> {
    return {
      name: faker.word.noun(),
    };
  }

}

export class FilterValueFactory extends Factory<FilterValue> {

  model = FilterValue;

  definition(faker: Faker): Partial<FilterValue> {
    return {
      value: faker.word.noun(),
    };
  }

}


