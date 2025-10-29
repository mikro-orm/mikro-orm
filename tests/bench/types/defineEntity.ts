import { bench } from '@arktype/attest';
import {
  type ScalarReference,
  type Reference,
  type PrimaryKeyProp,
  defineEntity,
  EntitySchema,
  p,
} from '@mikro-orm/core';

bench('defineEntity with relations', () => {
  const Foo = defineEntity({
    name: 'Foo',
    properties: {
      name: p.string().primary(),
      toOne: () => p.oneToOne(Foo),
      toOneNullable: () => p.oneToOne(Foo).nullable(),
      toOneRef: () => p.oneToOne(Foo).ref(),
      // toOneRefNullable: () => p.oneToOne(Foo).ref().nullable(),
      toOnePk: () => p.oneToOne(Foo).mapToPk(),
      toOnePkNullable: () => p.oneToOne(Foo).mapToPk().nullable(),
      scalarRef: p.string().ref(),
      scalarRefNullable: p.string().ref().nullable(),
    },
  });
}).types([42446, 'instantiations']);

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
}).types([42792, 'instantiations']);

bench('defineEntity only with ref and nullable', () => {
  const Foo = defineEntity({
    name: 'Foo',
    properties: {
      name: p.string().primary(),
      toOneRefNullable: () => p.oneToOne(Foo).ref().nullable(),
    },
  });
}).types([40763, 'instantiations']);

bench('defineEntity only with nullable and ref', () => {
  const Foo = defineEntity({
    name: 'Foo',
    properties: {
      name: p.string().primary(),
      toOneRefNullable: () => p.oneToOne(Foo).nullable().ref(),
    },
  });
}).types([40767, 'instantiations']);

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
      toOne: { kind: '1:1', entity: 'Foo' },
      toOneNullable: { kind: '1:1', entity: 'Foo', nullable: true },
      toOneRef: { kind: '1:1', entity: 'Foo', ref: true },
      toOneRefNullable: {
        kind: '1:1',
        entity: 'Foo',
        ref: true,
        nullable: true,
      },
      toOnePk: { kind: '1:1', entity: 'Foo', mapToPk: true },
      toOnePkNullable: {
        kind: '1:1',
        entity: 'Foo',
        mapToPk: true,
        nullable: true,
      },
      scalarRef: { kind: '1:1', entity: 'string', ref: true },
      scalarRefNullable: {
        kind: '1:1',
        entity: 'string',
        ref: true,
        nullable: true,
      },
    },
  });
}).types([5211, 'instantiations']);
