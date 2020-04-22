---
title: Inheritance Mapping
---

# Mapped Superclasses

A mapped superclass is an abstract or concrete class that provides persistent entity state and 
mapping information for its subclasses, but which is not itself an entity. Typically, the purpose 
of such a mapped superclass is to define state and mapping information that is common to multiple 
entity classes.

Mapped superclasses, just as regular, non-mapped classes, can appear in the middle of an otherwise 
mapped inheritance hierarchy (through Single Table Inheritance).

> A mapped superclass cannot be an entity, it is not query-able and persistent relationships defined 
> by a mapped superclass must be unidirectional (with an owning side only). This means that One-To-Many 
> associations are not possible on a mapped superclass at all. Furthermore Many-To-Many associations 
> are only possible if the mapped superclass is only used in exactly one entity at the moment. For 
> further support of inheritance, the single table inheritance features have to be used.

```typescript
// do not use @Entity decorator on base classes
export abstract class Person {

  @Property()
  mapped1!: number;

  @Property()
  mapped2!: string;
 
  @OneToOne()
  toothbrush!: Toothbrush;

  // ... more fields and methods
}

@Entity()
export class Employee extends Person {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // ... more fields and methods

}

@Entity()
export class Toothbrush {
  
  @PrimaryKey()
  id!: number;

  // ... more fields and methods

}
```

The DDL for the corresponding database schema would look something like this (this is for SQLite):

```sql
create table `employee` (
  `id` int unsigned not null auto_increment primary key,
  `name` varchar(255) not null, `mapped1` integer not null,
  `mapped2` varchar(255) not null,
  `toothbrush_id` integer not null
);
```

As you can see from this DDL snippet, there is only a single table for the entity 
subclass. All the mappings from the mapped superclass were inherited to the subclass 
as if they had been defined on that class directly.

# Single Table Inheritance

> Support for STI was added in version 4.0

[Single Table Inheritance](https://martinfowler.com/eaaCatalog/singleTableInheritance.html) 
is an inheritance mapping strategy where all classes of a hierarchy are mapped to a single 
database table. In order to distinguish which row represents which type in the hierarchy 
a so-called discriminator column is used.

```typescript
@Entity({
  discriminatorColumn: 'discr',
  discriminatorMap: { person: 'Person', employee: 'Employee' },
})
export class Person {
  // ...
}

@Entity()
export class Employee extends Person {
  // ...
}
```

Things to note:

- The `discriminatorColumn` option must be specified on the topmost class that is 
  part of the mapped entity hierarchy.
- The `discriminatorMap` specifies which values of the discriminator column identify 
  a row as being of a certain type. In the case above a value of `person` identifies
  a row as being of type `Person` and `employee` identifies a row as being of type 
  `Employee`.
- All entity classes that is part of the mapped entity hierarchy (including the topmost 
  class) should be specified in the `discriminatorMap`. In the case above `Person` class
  included.
- If no discriminator map is provided, then the map is generated automatically. 
  The automatically generated discriminator map contains the table names that would be
  otherwise used in case of regular entities. 

## Design-time considerations

This mapping approach works well when the type hierarchy is fairly simple and stable. 
Adding a new type to the hierarchy and adding fields to existing supertypes simply 
involves adding new columns to the table, though in large deployments this may have 
an adverse impact on the index and column layout inside the database.

## Performance impact

This strategy is very efficient for querying across all types in the hierarchy or 
for specific types. No table joins are required, only a WHERE clause listing the 
type identifiers. In particular, relationships involving types that employ this 
mapping strategy are very performing.

## SQL Schema considerations

For Single-Table-Inheritance to work in scenarios where you are using either a legacy 
database schema or a self-written database schema you have to make sure that all 
columns that are not in the root entity but in any of the different sub-entities 
has to allow null values. Columns that have NOT NULL constraints have to be on the 
root entity of the single-table inheritance hierarchy.

> This part of documentation is highly inspired by [doctrine docs](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/reference/inheritance-mapping.html)
> as the behaviour here is pretty much the same.
