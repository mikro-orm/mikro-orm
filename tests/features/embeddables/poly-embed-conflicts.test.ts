import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

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
    data: () => p.embedded([documentDataAwEdCard, documentDataCoCheckMig, documentDataMvDiCard]).object(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    dbName: ':memory:',
    entities: [
      base,
      documentDataAwEdCard,
      documentDataAwEdCardIn,
      documentDataAwEdCardOut,
      documentDataCoCheckMig,
      documentDataCoCheckMigIn,
      documentDataCoCheckMigOut,
      documentDataMvDiCard,
      documentDataMvDiCardIn,
      documentDataMvDiCardOut,
      documentData,
      document,
    ],
  });
  await orm.schema.create();

  await orm.em.insert(document, {
    data: {
      discriminator: 'AW.ED-CARD',
      in: {
        airline: 'Aruba Airlines',
        flightNumber: 'AW123',
      },
      iso: 'AW',
      out: {
        city: 'Oranjestad',
      },
      type: 'ED-CARD',
    },
  });
  await orm.em.insert(document, {
    data: {
      discriminator: 'CO.CHECK-MIG',
      in: {
        checkpoint: 'El Dorado International Airport',
        flightNumber: 'CO456',
      },
      iso: 'CO',
      out: {
        state: 'Cundinamarca',
      },
      type: 'CHECK-MIG',
    },
  });
  await orm.em.insert(document, {
    data: {
      discriminator: 'MV.DI-CARD',
      in: {
        flightNumber: 'MV789',
        pnr: 'ABC123',
      },
      iso: 'MV',
      out: {
        country: 'United States',
      },
      type: 'DI-CARD',
    },
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('poly embeddables with overridden props', async () => {
  const documents = await orm.em.find(document, {});
  const awDocument = documents.find(document => document.data.iso === 'AW');
  const coDocument = documents.find(document => document.data.iso === 'CO');
  const mvDocument = documents.find(document => document.data.iso === 'MV');

  expect(awDocument).toMatchObject({
    data: {
      discriminator: 'AW.ED-CARD',
      in: {
        airline: 'Aruba Airlines',
        flightNumber: 'AW123',
      },
      iso: 'AW',
      out: {
        city: 'Oranjestad',
      },
      type: 'ED-CARD',
    },
  });
  expect(coDocument).toMatchObject({
    data: {
      discriminator: 'CO.CHECK-MIG',
      in: {
        checkpoint: 'El Dorado International Airport',
        flightNumber: 'CO456',
      },
      iso: 'CO',
      out: {
        state: 'Cundinamarca',
      },
      type: 'CHECK-MIG',
    },
  });
  expect(mvDocument).toMatchObject({
    data: {
      discriminator: 'MV.DI-CARD',
      in: {
        flightNumber: 'MV789',
        pnr: 'ABC123',
      },
      iso: 'MV',
      out: {
        country: 'United States',
      },
      type: 'DI-CARD',
    },
  });
});
