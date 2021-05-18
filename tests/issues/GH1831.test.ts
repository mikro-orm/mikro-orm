import { Collection, Entity, IdentifiedReference, LoadStrategy, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class FilterValue {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Filter, { wrappedReference: true })
  filter!: IdentifiedReference<Filter>;
}

@Entity()
export class Filter {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Project, { wrappedReference: true })
  project!: IdentifiedReference<Project>;

  @OneToMany(() => FilterValue, (values) => values.filter)
  values = new Collection<FilterValue>(this);
}

@Entity()
export class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Filter, manager => manager.project)
  filters = new Collection<Filter>(this);
}

export class FilterValueDto {
  name!: string;
}

export class FilterDto {
  name!: string;

  values!: FilterValueDto[];
}

export class ProjectDto {
  name!: string;

  filters!: FilterDto[];
}

describe('GH issue 1831', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [Project, Filter, FilterValue]
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1831`, async () => {
    const projectDto = new ProjectDto();
    const filterDto = new FilterDto();
    const filterValueDto = new FilterValueDto();

    filterValueDto.name = 'Apple';

    filterDto.name = 'Fruits';
    filterDto.values = [filterValueDto];

    projectDto.name = 'Project name';
    projectDto.filters = [
      filterDto
    ];
    const project = orm.em.create(Project, projectDto);
    console.log(project);
    expect(project.filters.length).toBe(1);
    expect(project.filters[0].name).toBe('Fruits');
    expect(project.filters[0].id).toBeUndefined();
  });

});
