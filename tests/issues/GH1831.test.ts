import { Collection, Ref, MikroORM, PlainObject } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class FilterValue {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Filter, { ref: true })
  filter!: Ref<Filter>;

}

@Entity()
export class Filter {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Project, { ref: true })
  project!: Ref<Project>;

  @OneToMany(() => FilterValue, 'filter')
  values = new Collection<FilterValue>(this);

}

@Entity()
export class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Filter, 'project')
  filters = new Collection<Filter>(this);

}

export class FilterValueDto extends PlainObject {

  name!: string;

}

export class FilterDto extends PlainObject {

  name!: string;

  values!: FilterValueDto[];

}

export class ProjectDto extends PlainObject {

  name!: string;

  filters!: FilterDto[];

}

describe('GH issue 1831', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Project, Filter, FilterValue],
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`Create entity using a DTO`, async () => {
    const projectDto = new ProjectDto();
    const filterDto = new FilterDto();
    const filterValueDto = new FilterValueDto();

    filterValueDto.name = 'Apple';

    filterDto.name = 'Fruits';
    filterDto.values = [filterValueDto];

    projectDto.name = 'Project name';
    projectDto.filters = [
      filterDto,
    ];
    const project = orm.em.create(Project, projectDto);
    expect(project.filters.length).toBe(1);
    expect(project.filters[0].name).toBe('Fruits');
    expect(project.filters[0].id).toBeUndefined();
  });

});
