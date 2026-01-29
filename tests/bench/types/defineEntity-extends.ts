#!/usr/bin/env -S node --import @swc-node/register/esm-register

import { bench } from '@ark/attest';
import { defineEntity, p } from '@mikro-orm/core';

bench('entity extends entity', () => {
  const base = defineEntity({
    abstract: true,
    name: 'Base',
    properties: {
      id: p.integer().primary(),
    },
  });

  const child = defineEntity({
    extends: base,
    name: 'Child',
    properties: {
      extra: p.string(),
    },
  });
}).types([1400, 'instantiations']);

bench('entity extends entity with discriminator', () => {
  const base = defineEntity({
    abstract: true,
    discriminatorColumn: 'type',
    name: 'Base',
    properties: {
      id: p.integer().primary(),
      type: p.string(),
    },
  });

  const child = defineEntity({
    discriminatorValue: 'child',
    extends: base,
    name: 'Child',
    properties: {
      extra: p.string(),
    },
  });
}).types([1427, 'instantiations']);

bench('embeddable extends embeddable', () => {
  const base = defineEntity({
    abstract: true,
    embeddable: true,
    name: 'BaseEmb',
    properties: {
      foo: p.string(),
    },
  });

  const child = defineEntity({
    embeddable: true,
    extends: base,
    name: 'ChildEmb',
    properties: {
      bar: p.string(),
    },
  });
}).types([849, 'instantiations']);

bench('embeddable extends embeddable with discriminator', () => {
  const base = defineEntity({
    abstract: true,
    discriminatorColumn: 'type',
    embeddable: true,
    name: 'BaseEmb',
    properties: {
      type: p.string(),
      foo: p.string(),
    },
  });

  const child = defineEntity({
    discriminatorValue: 'child',
    embeddable: true,
    extends: base,
    name: 'ChildEmb',
    properties: {
      bar: p.string(),
    },
  });
}).types([876, 'instantiations']);

bench('polymorphic embeddables', () => {
  const base = defineEntity({
    abstract: true,
    name: 'Base',
    properties: {
      id: p.integer().primary(),
    },
  });

  const documentData = defineEntity({
    abstract: true,
    discriminatorColumn: 'discriminator',
    embeddable: true,
    name: 'DocumentData',
    properties: {
      discriminator: p.string().index(),
      iso: p.string().index(),
      type: p.string().index(),
    },
  });

  const documentDataAwEdCardIn = defineEntity({
    embeddable: true,
    name: 'DocumentDataAwEdCardIn',
    properties: {
      airline: p.string().nullable(),
      flightNumber: p.string().nullable(),
    },
  });

  const documentDataAwEdCardOut = defineEntity({
    embeddable: true,
    name: 'DocumentDataAwEdCardOut',
    properties: {
      city: p.string().nullable(),
    },
  });

  const documentDataAwEdCard = defineEntity({
    discriminatorValue: 'AW.ED-CARD',
    embeddable: true,
    extends: documentData,
    name: 'DocumentDataAwEdCard',
    properties: {
      in: () => p.embedded(documentDataAwEdCardIn).object(),
      out: () => p.embedded(documentDataAwEdCardOut).object(),
    },
  });

  const documentDataCoCheckMigIn = defineEntity({
    embeddable: true,
    name: 'DocumentDataCoCheckMigIn',
    properties: {
      checkpoint: p.string(),
      flightNumber: p.string().nullable(),
    },
  });

  const documentDataCoCheckMigOut = defineEntity({
    embeddable: true,
    name: 'DocumentDataCoCheckMigOut',
    properties: {
      state: p.string().nullable(),
    },
  });

  const documentDataCoCheckMig = defineEntity({
    discriminatorValue: 'CO.CHECK-MIG',
    embeddable: true,
    extends: documentData,
    name: 'DocumentDataCoCheckMig',
    properties: {
      in: () => p.embedded(documentDataCoCheckMigIn).object(),
      out: () => p.embedded(documentDataCoCheckMigOut).object(),
    },
  });

  const documentDataMvDiCardIn = defineEntity({
    embeddable: true,
    name: 'DocumentDataMvDiCardIn',
    properties: {
      flightNumber: p.string().nullable(),
      pnr: p.string(),
    },
  });

  const documentDataMvDiCardOut = defineEntity({
    embeddable: true,
    name: 'DocumentDataMvDiCardOut',
    properties: {
      country: p.string().nullable(),
    },
  });

  const documentDataMvDiCard = defineEntity({
    discriminatorValue: 'MV.DI-CARD',
    embeddable: true,
    extends: documentData,
    name: 'DocumentDataMvDiCard',
    properties: {
      in: () => p.embedded(documentDataMvDiCardIn).object(),
      out: () => p.embedded(documentDataMvDiCardOut).object(),
    },
  });

  const document = defineEntity({
    extends: base,
    name: 'Document',
    tableName: 'documents',
    properties: {
      data: () =>
        p
          .embedded([
            documentDataAwEdCard,
            documentDataCoCheckMig,
            documentDataMvDiCard,
          ])
          .object(),
    },
  });
}).types([3469, 'instantiations']);
