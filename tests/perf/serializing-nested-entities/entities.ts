import {
  Collection,
  Entity,
  IdentifiedReference,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';

@Entity()
export class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => Filter, filters => filters.project, { eager: true })
  public filters = new Collection<Filter>(this);

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => Risk, e => e.project, { eager: true })
  risks = new Collection<Risk>(this);

}

@Entity()
export class Risk {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Project, { serializer: p => p.id })
  project!: IdentifiedReference<Project>;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToMany(() => FilterValue, 'risks', {
    owner: true,
    pivotTable: 'risk_filter_values',
    eager: true,
    joinColumn: 'risk_id',
    inverseJoinColumn: 'filter_value_id',
  })
  public filterValues = new Collection<FilterValue>(this);

}

@Entity()
export class Filter {

  @PrimaryKey()
  public id!: number;

  @Property()
  public name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => FilterValue, values => values.filter, {
    eager: true,
  })
  public values = new Collection<FilterValue>(this);

  @ManyToOne(() => Project, {
    serializer: p => p.id,
    wrappedReference: true,
    onDelete: 'cascade',
  })
  public project!: IdentifiedReference<Project>;

}

@Entity()
export class FilterValue {

  @PrimaryKey()
  public id!: number;

  @Property({ length: 16000 })
  public value!: string;

  @ManyToOne(() => Filter, {
    serializer: f => f.id,
    wrappedReference: true,
    onDelete: 'cascade',
  })
  public filter!: IdentifiedReference<Filter>;

  @ManyToMany(() => Risk, risk => risk.filterValues, {
    hidden: true,
    owner: false,
  })
  public risks = new Collection<Risk>(this);

}
