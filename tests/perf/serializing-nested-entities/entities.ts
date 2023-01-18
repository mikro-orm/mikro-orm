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

  @OneToMany(() => Filter, filters => filters.project)
  filters = new Collection<Filter>(this);

  @OneToMany(() => Risk, e => e.project)
  risks = new Collection<Risk>(this);

}

@Entity()
export class Risk {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Project, { serializer: p => p.id, wrappedReference: true })
  project!: IdentifiedReference<Project>;

  @ManyToMany({
      entity: () => FilterValue,
    pivotTable: 'risk_filter_values',
    joinColumn: 'risk_id',
    inverseJoinColumn: 'filter_value_id',
  })
  filterValues = new Collection<FilterValue>(this);

}

@Entity()
export class Filter {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => FilterValue, values => values.filter)
  values = new Collection<FilterValue>(this);

  @ManyToOne(() => Project, {
    serializer: p => p.id,
    wrappedReference: true,
    onDelete: 'cascade',
  })
  project!: IdentifiedReference<Project>;

}

@Entity()
export class FilterValue {

  @PrimaryKey()
  id!: number;

  @Property({ length: 16000 })
  value!: string;

  @ManyToOne(() => Filter, {
    serializer: f => f.id,
    wrappedReference: true,
    onDelete: 'cascade',
  })
  filter!: IdentifiedReference<Filter>;

  @ManyToMany(() => Risk, risk => risk.filterValues, {
    hidden: true,
    owner: false,
  })
  risks = new Collection<Risk>(this);

}
