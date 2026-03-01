---
title: Inheritance Mapping
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Mapped Superclasses

A mapped superclass is an abstract or concrete class that provides persistent entity state and mapping information for its subclasses, but which is not itself an entity. Typically, the purpose of such a mapped superclass is to define state and mapping information that is common to multiple entity classes.

Mapped superclasses, just as regular, non-mapped classes, can appear in the middle of an otherwise mapped inheritance hierarchy (through Single Table Inheritance).

> A mapped superclass cannot be an entity, it is not query-able and persistent relationships defined by a mapped superclass must be unidirectional (with an owning side only). This means that One-To-Many associations are not possible on a mapped superclass at all. Furthermore, Many-To-Many associations are only possible if the mapped superclass is only used in exactly one entity at the moment. For further support of inheritance, the single table inheritance features have to be used.

> Also note that you can't use generics to define any relations. This means that you cannot have a generic type argument in the base entity that would be used as a target of some relation.

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'decorators', value: 'decorators'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const p = defineEntity.properties;

// mapped superclass (abstract entity that won't have its own table)
const PersonSchema = defineEntity({
  name: 'Person',
  abstract: true,
  properties: {
    mapped1: p.number(),
    mapped2: p.string(),
    toothbrush: () => p.oneToOne(Toothbrush),
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  properties: {
    id: p.number().primary(),
    name: p.string(),
  },
});

export const Toothbrush = defineEntity({
  name: 'Toothbrush',
  properties: {
    id: p.number().primary(),
    // ... more fields
  },
});

export class Person extends PersonSchema.class {}
PersonSchema.setClass(Person);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
const p = defineEntity.properties;

// mapped superclass (abstract entity that won't have its own table)
export const Person = defineEntity({
  name: 'Person',
  abstract: true,
  properties: {
    mapped1: p.number(),
    mapped2: p.string(),
    toothbrush: () => p.oneToOne(Toothbrush),
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  properties: {
    id: p.number().primary(),
    name: p.string(),
  },
});

export const Toothbrush = defineEntity({
  name: 'Toothbrush',
  properties: {
    id: p.number().primary(),
    // ... more fields
  },
});

export type Person = InferEntity<typeof Person>;
export type Employee = InferEntity<typeof Employee>;
export type Toothbrush = InferEntity<typeof Toothbrush>;
```

  </TabItem>
  <TabItem value="decorators">

```ts
// do not use @Entity decorator on base classes (mapped superclasses)
// we can also use @Entity({ abstract: true })
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

  </TabItem>
</Tabs>

The DDL for the corresponding database schema would look something like this (this is for SQLite):

```sql
create table `employee` (
  `id` int unsigned not null auto_increment primary key,
  `name` varchar(255) not null, `mapped1` integer not null,
  `mapped2` varchar(255) not null,
  `toothbrush_id` integer not null
);
```

As you can see from this DDL snippet, there is only a single table for the entity subclass. All the mappings from the mapped superclass were inherited to the subclass as if they had been defined on that class directly.

## Single Table Inheritance

> Support for STI was added in version 4.0

[Single Table Inheritance](https://martinfowler.com/eaaCatalog/singleTableInheritance.html) is an inheritance mapping strategy where all classes of a hierarchy are mapped to a single database table. In order to distinguish which row represents which type in the hierarchy a so-called discriminator column is used.

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'decorators', value: 'decorators'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const PersonSchema = defineEntity({
  name: 'Person',
  discriminatorColumn: 'discr',
  discriminatorMap: { person: 'Person', employee: 'Employee' },
  properties: {
    // ...
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  properties: {
    // ...
  },
});

export class Person extends PersonSchema.class {}
PersonSchema.setClass(Person);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
export const Person = defineEntity({
  name: 'Person',
  discriminatorColumn: 'discr',
  discriminatorMap: { person: 'Person', employee: 'Employee' },
  properties: {
    // ...
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  properties: {
    // ...
  },
});
```

  </TabItem>
  <TabItem value="decorators">

```ts
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

  </TabItem>
</Tabs>

Things to note:

- The `discriminatorColumn` option must be specified on the topmost class that is part of the mapped entity hierarchy.
- The `discriminatorMap` specifies which values of the discriminator column identify a row as being of a certain type. In the case above a value of `person` identifies a row as being of type `Person` and `employee` identifies a row as being of type `Employee`.
- All entity classes that are part of the mapped entity hierarchy (including the topmost class) should be specified in the `discriminatorMap`. In the case above `Person` class included.
- You can use abstract class as the root entity - then the root class should not be part of the discriminator map
- If no discriminator map is provided, then the map is generated automatically. The automatically generated discriminator map contains the table names that would be otherwise used in case of regular entities.

### Using `discriminatorValue` instead of `discriminatorMap`

As noted above, the discriminator map can be auto-generated. In that case, you might want to control the tokens that will be used in the map. To do so, you can use `discriminatorValue` on the child entities:

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'decorators', value: 'decorators'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const PersonSchema = defineEntity({
  name: 'Person',
  discriminatorColumn: 'discr',
  discriminatorValue: 'person',
  properties: {
    // ...
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  discriminatorValue: 'employee',
  properties: {
    // ...
  },
});

export class Person extends PersonSchema.class {}
PersonSchema.setClass(Person);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
export const Person = defineEntity({
  name: 'Person',
  discriminatorColumn: 'discr',
  discriminatorValue: 'person',
  properties: {
    // ...
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  discriminatorValue: 'employee',
  properties: {
    // ...
  },
});
```

  </TabItem>
  <TabItem value="decorators">

```ts
@Entity({
  discriminatorColumn: 'discr',
  discriminatorValue: 'person',
})
export class Person {
  // ...
}

@Entity({
  discriminatorValue: 'employee',
})
export class Employee extends Person {
  // ...
}
```

  </TabItem>
</Tabs>

### Explicit discriminator column

The `discriminatorColumn` specifies the name of a special column that will be used to define what type of class a given row should be represented with. It will be defined automatically for us, and it will stay hidden (it won't be hydrated as a regular property).

On the other hand, it is perfectly fine to define the column explicitly. Doing so, you will be able to:

- querying by the type, e.g. `em.find(Person, { type: { $ne: 'employee' } }`
- the column will be part of the serialized response

Following example shows how you can define the discriminator explicitly, as well as a version where root entity is abstract class.

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'decorators', value: 'decorators'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const BasePersonSchema = defineEntity({
  name: 'BasePerson',
  abstract: true,
  discriminatorColumn: 'type',
  discriminatorMap: { person: 'Person', employee: 'Employee' },
  properties: {
    type: p.enum(['person', 'employee'] as const),
  },
});

export const Person = defineEntity({
  name: 'Person',
  extends: BasePerson,
  properties: {
    // ...
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  properties: {
    // ...
  },
});

export class BasePerson extends BasePersonSchema.class {}
BasePersonSchema.setClass(BasePerson);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
export const BasePerson = defineEntity({
  name: 'BasePerson',
  abstract: true,
  discriminatorColumn: 'type',
  discriminatorMap: { person: 'Person', employee: 'Employee' },
  properties: {
    type: p.enum(['person', 'employee'] as const),
  },
});

export const Person = defineEntity({
  name: 'Person',
  extends: BasePerson,
  properties: {
    // ...
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  properties: {
    // ...
  },
});
```

  </TabItem>
  <TabItem value="decorators">

```ts
@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: { person: 'Person', employee: 'Employee' },
})
export abstract class BasePerson {

  @Enum()
  type!: 'person' | 'employee';

}

@Entity()
export class Person extends BasePerson {
  // ...
}

@Entity()
export class Employee extends Person {
  // ...
}
```

  </TabItem>
</Tabs>

If you want to use `discriminatorValue` with abstract entities, you need to mark the entity as `abstract: true` so it can be skipped from the discriminator map:

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'decorators', value: 'decorators'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const BasePersonSchema = defineEntity({
  name: 'BasePerson',
  abstract: true,
  discriminatorColumn: 'type',
  properties: {
    type: p.enum(['person', 'employee'] as const),
  },
});

export const Person = defineEntity({
  name: 'Person',
  extends: BasePerson,
  discriminatorValue: 'person',
  properties: {
    // ...
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  discriminatorValue: 'employee',
  properties: {
    // ...
  },
});

export class BasePerson extends BasePersonSchema.class {}
BasePersonSchema.setClass(BasePerson);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
export const BasePerson = defineEntity({
  name: 'BasePerson',
  abstract: true,
  discriminatorColumn: 'type',
  properties: {
    type: p.enum(['person', 'employee'] as const),
  },
});

export const Person = defineEntity({
  name: 'Person',
  extends: BasePerson,
  discriminatorValue: 'person',
  properties: {
    // ...
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  discriminatorValue: 'employee',
  properties: {
    // ...
  },
});
```

  </TabItem>
  <TabItem value="decorators">

```ts
@Entity({
  discriminatorColumn: 'type',
  abstract: true,
})
export abstract class BasePerson {

  @Enum()
  type!: 'person' | 'employee';

}

@Entity({ discriminatorValue: 'person' })
export class Person extends BasePerson {
  // ...
}

@Entity({ discriminatorValue: 'employee' })
export class Employee extends Person {
  // ...
}
```

  </TabItem>
</Tabs>

### Design-time considerations

This mapping approach works well when the type hierarchy is fairly simple and stable. Adding a new type to the hierarchy and adding fields to existing supertypes simply involves adding new columns to the table, though in large deployments this may have an adverse impact on the index and column layout inside the database.

### Performance impact

This strategy is very efficient for querying across all types in the hierarchy or for specific types. No table joins are required, only a WHERE clause listing the type identifiers. In particular, relationships involving types that employ this mapping strategy are very performant.

### SQL Schema considerations

For Single-Table-Inheritance to work in scenarios where you are using either a legacy database schema or a self-written database schema, you have to make sure that all columns that are not in the root entity but in any of the different sub-entities has to allow null values. Columns that have NOT NULL constraints have to be on the root entity of the single-table inheritance hierarchy.

> This part of documentation is highly inspired by [doctrine docs](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/reference/inheritance-mapping.html) as the behaviour here is pretty much the same.

## See also: Polymorphic Relations

If you need a relationship that can point to multiple unrelated entity types (each with their own table), consider using [Polymorphic Relations](./relationships.md#polymorphic-relations) instead of inheritance.

| Feature      | Single Table Inheritance                         | Polymorphic Relations                           |
|--------------|--------------------------------------------------|-------------------------------------------------|
| Storage      | Single table for all types                       | Each type has its own table                     |
| Use case     | Entities share common fields/behavior            | Flexible FK to unrelated entities               |
| Inheritance  | Required (common base class)                     | Not required                                    |
| Foreign keys | Native FK constraints with referential integrity | No FK constraints (no database-level integrity) |
| Example      | `Cat`, `Dog` extending `Animal`                  | `Like` pointing to `Post` or `Comment`          |

## Table-Per-Type Inheritance (TPT)

[Table-Per-Type Inheritance](https://martinfowler.com/eaaCatalog/classTableInheritance.html) (also known as Class Table Inheritance) is an inheritance mapping strategy where each class in the hierarchy has its own dedicated database table. Unlike STI where all entities share a single table with many nullable columns, TPT creates:

- A separate table for each entity containing only its own properties
- Child tables have a foreign key to the parent table (using the same primary key value)
- `ON DELETE CASCADE` ensures proper cleanup when parent records are deleted

### Configuration

Use `inheritance: 'tpt'` on the root entity of the hierarchy:

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'decorators', value: 'decorators'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const PersonSchema = defineEntity({
  name: 'Person',
  abstract: true,
  inheritance: 'tpt',
  properties: {
    id: p.number().primary(),
    name: p.string(),
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  properties: {
    department: p.string(),
  },
});

export const Customer = defineEntity({
  name: 'Customer',
  extends: Person,
  properties: {
    loyaltyPoints: p.number(),
  },
});

export class Person extends PersonSchema.class {}
PersonSchema.setClass(Person);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
export const Person = defineEntity({
  name: 'Person',
  abstract: true,
  inheritance: 'tpt',
  properties: {
    id: p.number().primary(),
    name: p.string(),
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  properties: {
    department: p.string(),
  },
});

export const Customer = defineEntity({
  name: 'Customer',
  extends: Person,
  properties: {
    loyaltyPoints: p.number(),
  },
});
```

  </TabItem>
  <TabItem value="decorators">

```ts
@Entity({ inheritance: 'tpt' })
export abstract class Person {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
export class Employee extends Person {

  @Property()
  department!: string;

}

@Entity()
export class Customer extends Person {

  @Property()
  loyaltyPoints!: number;

}
```

  </TabItem>
</Tabs>

### Generated Schema

The above configuration generates the following schema:

```sql
CREATE TABLE person (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE employee (
  id INTEGER PRIMARY KEY REFERENCES person(id) ON DELETE CASCADE,
  department TEXT NOT NULL
);

CREATE TABLE customer (
  id INTEGER PRIMARY KEY REFERENCES person(id) ON DELETE CASCADE,
  loyalty_points INTEGER NOT NULL
);
```

### How TPT Works

#### INSERT Operations

When inserting a TPT entity, MikroORM automatically inserts into all tables in the hierarchy, starting from the root:

```ts
const employee = em.create(Employee, {
  name: 'John Doe',
  department: 'Engineering',
});
await em.flush();

// Executes:
// INSERT INTO person (name) VALUES ('John Doe') -- returns id=1
// INSERT INTO employee (id, department) VALUES (1, 'Engineering')
```

#### UPDATE Operations

Updates are optimized to only modify tables that contain changed properties:

```ts
employee.department = 'Sales'; // Only updates employee table
employee.name = 'Jane Doe';    // Only updates person table
await em.flush();
```

#### DELETE Operations

Deleting from the root table cascades to child tables automatically via the foreign key constraint:

```ts
em.remove(employee);
await em.flush();

// Executes:
// DELETE FROM person WHERE id = 1
// (employee row is deleted automatically via ON DELETE CASCADE)
```

#### SELECT Operations

When querying a TPT entity, MikroORM automatically joins all parent tables:

```ts
const employees = await em.find(Employee, { department: 'Engineering' });

// Executes:
// SELECT e0.*, p1.*
// FROM employee e0
// INNER JOIN person p1 ON e0.id = p1.id
// WHERE e0.department = 'Engineering'
```

### Multi-level Inheritance

TPT supports deep inheritance hierarchies. Each level adds another table and join:

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'decorators', value: 'decorators'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const PersonSchema = defineEntity({
  name: 'Person',
  abstract: true,
  inheritance: 'tpt',
  properties: {
    id: p.number().primary(),
    name: p.string(),
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  properties: {
    department: p.string(),
  },
});

export const Manager = defineEntity({
  name: 'Manager',
  extends: Employee,
  properties: {
    teamSize: p.number(),
  },
});

export class Person extends PersonSchema.class {}
PersonSchema.setClass(Person);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
export const Person = defineEntity({
  name: 'Person',
  abstract: true,
  inheritance: 'tpt',
  properties: {
    id: p.number().primary(),
    name: p.string(),
  },
});

export const Employee = defineEntity({
  name: 'Employee',
  extends: Person,
  properties: {
    department: p.string(),
  },
});

export const Manager = defineEntity({
  name: 'Manager',
  extends: Employee,
  properties: {
    teamSize: p.number(),
  },
});
```

  </TabItem>
  <TabItem value="decorators">

```ts
@Entity({ inheritance: 'tpt' })
export abstract class Person {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
export class Employee extends Person {
  @Property()
  department!: string;
}

@Entity()
export class Manager extends Employee {
  @Property()
  teamSize!: number;
}
```

  </TabItem>
</Tabs>

This generates three tables with a chain of foreign keys:

```sql
CREATE TABLE person (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE employee (id INTEGER PRIMARY KEY REFERENCES person(id) ON DELETE CASCADE, department TEXT NOT NULL);
CREATE TABLE manager (id INTEGER PRIMARY KEY REFERENCES employee(id) ON DELETE CASCADE, team_size INTEGER NOT NULL);
```

Querying `Manager` will join all three tables:

```ts
const managers = await em.find(Manager, {});

// SELECT m0.*, e1.*, p2.*
// FROM manager m0
// INNER JOIN employee e1 ON m0.id = e1.id
// INNER JOIN person p2 ON e1.id = p2.id
```

### Design-time Considerations

TPT is ideal when:

- **Schema normalization is important** - Each table contains only relevant columns with proper NOT NULL constraints
- **Subtypes have many unique properties** - Avoids wide tables with many nullable columns
- **You need to enforce data integrity** - Foreign keys ensure referential integrity across the hierarchy

TPT may not be ideal when:

- **You frequently query across the entire hierarchy** - Requires joins across all tables
- **Performance is critical for read-heavy workloads** - STI can be faster for polymorphic queries
- **The hierarchy is very deep** - Each level adds another join

### Performance Impact

- **Writes**: Slightly slower than STI due to multiple INSERT/UPDATE statements
- **Reads of specific types**: Requires joins but returns only relevant data
- **Polymorphic queries**: When querying a base class (e.g., `em.find(Person, {})`), the ORM LEFT JOINs all descendant tables to determine the concrete type. For hierarchies with many leaf types, this can produce wide queries. If this becomes a bottleneck, query concrete classes directly instead
- **Schema size**: More tables but each table is narrower and better normalized

### STI vs TPT Comparison

| Aspect | STI | TPT |
|--------|-----|-----|
| Tables | Single table for hierarchy | One table per entity |
| Columns | All columns, many nullable | Only own properties, properly constrained |
| INSERT | Single statement | Multiple statements (parent first) |
| SELECT | Single table scan | JOIN across hierarchy |
| Schema | Denormalized | Normalized |
| Best for | Simple hierarchies, read-heavy | Complex hierarchies, write-heavy with integrity needs |

### Limitations

- **Delete cascading and lifecycle hooks**: Child table rows are deleted via `ON DELETE CASCADE` at the database level. This means `beforeDelete`/`afterDelete` hooks will only fire for the entity being explicitly removed — not for child table rows cascaded by the database. If you need hooks on every table in the hierarchy, issue explicit deletes per table.
- **Soft delete**: Because delete cascading is handled by the database, soft-delete patterns (e.g., `@Filter` to hide deleted rows) are not automatically TPT-aware. The database CASCADE will physically delete child rows even if the parent uses a soft-delete filter.
- **Schema callbacks scope**: Index expressions, check constraints, and generated column callbacks for a TPT entity only have access to columns in that entity's own table. You cannot reference inherited columns from a parent table in these callbacks.
- **Custom discriminator columns**: TPT uses a computed discriminator (CASE WHEN) at query time. Unlike STI, you cannot specify a custom persisted discriminator column.

### Mixing STI and TPT

Mixing STI and TPT within the same inheritance hierarchy is not supported and will result in a validation error. Each hierarchy must use one strategy consistently.
