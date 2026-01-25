#!/usr/bin/env -S node --import @swc-node/register/esm-register

import { bench } from '@ark/attest';
import {
  type ScalarReference,
  type Reference,
  defineEntity,
  EntitySchema,
  p,
  PrimaryKeyProp,
} from '@mikro-orm/core';

bench('defineEntity with relations', () => {
  const Foo = defineEntity({
    name: 'Foo',
    properties: {
      name: p.string().primary(),
      toOne: () => p.oneToOne(Foo),
      toOneNullable: () => p.oneToOne(Foo).nullable(),
      toOneRef: () => p.oneToOne(Foo).ref(),
      toOnePk: () => p.oneToOne(Foo).mapToPk(),
      toOnePkNullable: () => p.oneToOne(Foo).mapToPk().nullable(),
      scalarRef: p.string().ref(),
      scalarRefNullable: p.string().ref().nullable(),
    },
  });
}).types([13000, 'instantiations']);

bench('defineEntity with ref and nullable', () => {
  const Foo = defineEntity({
    name: 'Foo',
    properties: {
      name: p.string().primary(),
      toOne: () => p.oneToOne(Foo),
      toOneNullable: () => p.oneToOne(Foo).nullable(),
      toOneRef: () => p.oneToOne(Foo).ref(),
      toOneRefNullable: () => p.oneToOne(Foo).ref().nullable(),
      toOnePk: () => p.oneToOne(Foo).mapToPk(),
      toOnePkNullable: () => p.oneToOne(Foo).mapToPk().nullable(),
      scalarRef: p.string().ref(),
      scalarRefNullable: p.string().ref().nullable(),
    },
  });
}).types([13400, 'instantiations']);

bench('defineEntity only with ref and nullable', () => {
  const Foo = defineEntity({
    name: 'Foo',
    properties: {
      name: p.string().primary(),
      toOneRefNullable: () => p.oneToOne(Foo).ref().nullable(),
    },
  });
}).types([11300, 'instantiations']);

bench('defineEntity only with nullable and ref', () => {
  const Foo = defineEntity({
    name: 'Foo',
    properties: {
      name: p.string().primary(),
      toOneRefNullable: () => p.oneToOne(Foo).nullable().ref(),
    },
  });
}).types([11300, 'instantiations']);

bench('defineEntity with relations using class', () => {
  class Foo {

    name!: string;
    toOne!: Foo;
    toOneNullable!: Foo | null | undefined;
    toOneRef!: Reference<Foo>;
    toOneRefNullable!: Reference<Foo> | null | undefined;
    toOnePk!: string;
    toOnePkNullable!: string | null | undefined;
    scalarRef!: ScalarReference<string>;
    scalarRefNullable!: ScalarReference<string | null | undefined>;
    [PrimaryKeyProp]?: 'name';

  }

  const FooSchema = defineEntity({
    class: Foo,
    className: 'Foo',
    tableName: 'foos',
    properties: {
      name: p.string().primary(),
      toOne: () => p.oneToOne(Foo),
      toOneNullable: () => p.oneToOne(Foo).nullable(),
      toOneRef: () => p.oneToOne(Foo).ref(),
      toOneRefNullable: () => p.oneToOne(Foo).ref().nullable(),
      toOnePk: () => p.oneToOne(Foo).mapToPk(),
      toOnePkNullable: () => p.oneToOne(Foo).mapToPk().nullable(),
      scalarRef: p.string().ref(),
      scalarRefNullable: p.string().ref().nullable(),
    },
  });
}).types([12000, 'instantiations']);

bench('defineEntity with ref and nullable using class', () => {
  class Foo {

    name!: string;
    toOne!: Foo;
    toOneNullable!: Foo | null | undefined;
    toOneRef!: Reference<Foo>;
    toOneRefNullable!: Reference<Foo> | null | undefined;
    toOnePk!: string;
    toOnePkNullable!: string | null | undefined;
    scalarRef!: ScalarReference<string>;
    scalarRefNullable!: ScalarReference<string | null | undefined>;
    [PrimaryKeyProp]?: 'name';

  }

  const FooSchema = defineEntity({
    class: Foo,
    className: 'Foo',
    tableName: 'foos',
    properties: {
      name: p.string().primary(),
      toOne: () => p.oneToOne(Foo),
      toOneNullable: () => p.oneToOne(Foo).nullable(),
      toOneRef: () => p.oneToOne(Foo).ref(),
      toOneRefNullable: () => p.oneToOne(Foo).ref().nullable(),
      toOnePk: () => p.oneToOne(Foo).mapToPk(),
      toOnePkNullable: () => p.oneToOne(Foo).mapToPk().nullable(),
      scalarRef: p.string().ref(),
      scalarRefNullable: p.string().ref().nullable(),
    },
  });
}).types([12000, 'instantiations']);

bench('defineEntity only with ref and nullable using class', () => {
  class Foo {

    name!: string;
    toOneRefNullable!: Reference<Foo> | null | undefined;
    [PrimaryKeyProp]?: 'name';

  }

  const FooSchema = defineEntity({
    class: Foo,
    className: 'Foo',
    tableName: 'foos',
    properties: {
      name: p.string().primary(),
      toOneRefNullable: () => p.oneToOne(Foo).ref().nullable(),
    },
  });
}).types([10000, 'instantiations']);

bench('defineEntity only with nullable and ref using class', () => {
  class Foo {

    name!: string;
    toOneRefNullable!: Reference<Foo> | null | undefined;
    [PrimaryKeyProp]?: 'name';

  }

  const FooSchema = defineEntity({
    class: Foo,
    className: 'Foo',
    tableName: 'foos',
    properties: {
      name: p.string().primary(),
      toOneRefNullable: () => p.oneToOne(Foo).nullable().ref(),
    },
  });
}).types([10000, 'instantiations']);

bench('EntitySchema', () => {
  interface IFoo {
    name: string;
    toOne: IFoo;
    toOneNullable: IFoo | null | undefined;
    toOneRef: Reference<IFoo>;
    toOneRefNullable: Reference<IFoo> | null | undefined;
    toOnePk: string;
    toOnePkNullable: string | null | undefined;
    scalarRef: ScalarReference<string>;
    scalarRefNullable: ScalarReference<string | null | undefined>;
    [PrimaryKeyProp]?: 'name';
  }

  const FooSchema = new EntitySchema<IFoo>({
    name: 'Foo',
    properties: {
      name: { type: 'string', primary: true },
      toOne: { kind: '1:1', entity: () => FooSchema as any },
      toOneNullable: { kind: '1:1', entity: () => FooSchema as any, nullable: true },
      toOneRef: { kind: '1:1', entity: () => FooSchema as any, ref: true },
      toOneRefNullable: {
        kind: '1:1',
        entity: () => FooSchema as any,
        ref: true,
        nullable: true,
      },
      toOnePk: { kind: '1:1', entity: () => FooSchema as any, mapToPk: true },
      toOnePkNullable: {
        kind: '1:1',
        entity: () => FooSchema as any,
        mapToPk: true,
        nullable: true,
      },
      scalarRef: { kind: '1:1', entity: () => FooSchema as any, ref: true },
      scalarRefNullable: {
        kind: '1:1',
        entity: () => FooSchema as any,
        ref: true,
        nullable: true,
      },
    } as any,
  });
}).types([300, 'instantiations']);

bench('defineEntity with setClass pattern (circular relations)', () => {
  const AuthorSchema = defineEntity({
    name: 'Author',
    properties: {
      id: p.integer().primary(),
      firstName: p.string(),
      lastName: p.string(),
      books: () => p.oneToMany(Book).mappedBy('author'),
    },
  });

  const BookSchema = defineEntity({
    name: 'Book',
    properties: {
      id: p.integer().primary(),
      title: p.string(),
      author: () => p.manyToOne(Author),
    },
  });

  class Author extends AuthorSchema.class {

    fullName() {
      return `${this.firstName} ${this.lastName}`;
    }

}

  class Book extends BookSchema.class {

    get summary() {
      return `"${this.title}" by ${this.author.fullName()}`;
    }

}

  AuthorSchema.setClass(Author);
  BookSchema.setClass(Book);
}).types([8700, 'instantiations']);
