import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Embeddable({ abstract: true, discriminatorColumn: 'discriminator' })
abstract class DocumentData {

  @Property()
  discriminator!: string;

  @Property()
  iso!: string;

  @Property()
  type!: string;

}

@Embeddable()
class DocumentDataAwEdCardIn {

  @Property({ nullable: true })
  airline?: string;

  @Property({ nullable: true })
  flightNumber?: string;

}

@Embeddable()
class DocumentDataAwEdCardOut {

  @Property({ nullable: true })
  city?: string;

}

@Embeddable({ discriminatorValue: 'AW.ED-CARD' })
class DocumentDataAwEdCard extends DocumentData {

  @Embedded(() => DocumentDataAwEdCardIn, { object: true })
  in!: DocumentDataAwEdCardIn;

  @Embedded(() => DocumentDataAwEdCardOut, { object: true })
  out!: DocumentDataAwEdCardOut;

}

@Embeddable()
class DocumentDataCoCheckMigIn {

  @Property()
  checkpoint!: string;

  @Property({ nullable: true })
  flightNumber?: string;

}

@Embeddable()
class DocumentDataCoCheckMigOut {

  @Property({ nullable: true })
  state?: string;

}

@Embeddable({ discriminatorValue: 'CO.CHECK-MIG' })
class DocumentDataCoCheckMig extends DocumentData {

  @Embedded(() => DocumentDataCoCheckMigIn, { object: true })
  in!: DocumentDataCoCheckMigIn;

  @Embedded(() => DocumentDataCoCheckMigOut, { object: true })
  out!: DocumentDataCoCheckMigOut;

}

@Embeddable()
class DocumentDataMvDiCardIn {

  @Property({ nullable: true })
  flightNumber?: string;

  @Property()
  pnr!: string;

}

@Embeddable()
class DocumentDataMvDiCardOut {

  @Property({ nullable: true })
  country?: string;

}

@Embeddable({ discriminatorValue: 'MV.DI-CARD' })
class DocumentDataMvDiCard extends DocumentData {

  @Embedded(() => DocumentDataMvDiCardIn, { object: true })
  in!: DocumentDataMvDiCardIn;

  @Embedded(() => DocumentDataMvDiCardOut, { object: true })
  out!: DocumentDataMvDiCardOut;

}

@Entity({ tableName: 'documents' })
class Document {

  @PrimaryKey()
  id!: number;

  @Embedded(() => [DocumentDataAwEdCard, DocumentDataCoCheckMig, DocumentDataMvDiCard], { object: true })
  data!: DocumentDataAwEdCard | DocumentDataCoCheckMig | DocumentDataMvDiCard;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    driver: SqliteDriver,
    entities: [
      Document,
      DocumentData,
      DocumentDataAwEdCard,
      DocumentDataAwEdCardIn,
      DocumentDataAwEdCardOut,
      DocumentDataCoCheckMig,
      DocumentDataCoCheckMigIn,
      DocumentDataCoCheckMigOut,
      DocumentDataMvDiCard,
      DocumentDataMvDiCardIn,
      DocumentDataMvDiCardOut,
    ],
  });
  await orm.schema.createSchema();

  await orm.em.insert(Document, {
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
  await orm.em.insert(Document, {
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
  await orm.em.insert(Document, {
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
  const documents = await orm.em.find(Document, {});
  const awDocument = documents.find(doc => doc.data.iso === 'AW');
  const coDocument = documents.find(doc => doc.data.iso === 'CO');
  const mvDocument = documents.find(doc => doc.data.iso === 'MV');

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
