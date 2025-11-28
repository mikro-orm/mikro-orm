import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';

import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
class PersonName {

  constructor(readonly givenName: string, readonly surname: string) {}

}

export const PersonNameSchema = new EntitySchema<PersonName>({
  class: PersonName,
  embeddable: true,
  properties: {
    givenName: { type: 'string' },
    surname: { type: 'string' },
  },
});

class EmergencyContact {

  constructor(readonly name: PersonName, readonly relationship: string) {}

}

export const EmergencyContactSchema = new EntitySchema({
  class: EmergencyContact,
  embeddable: true,
  properties: {
    name: {
      kind: 'embedded',
      entity: () => PersonName,
      prefix: false,
    },
    relationship: { type: 'string' },
  },
});

class Patient {

  constructor(
    readonly id: string,
    readonly name: PersonName,
    readonly emergencyContact: EmergencyContact,
  ) {}

}

export const PatientSchema = new EntitySchema({
  class: Patient,
  properties: {
    id: {
      type: 'text',
      primary: true,
    },
    name: {
      kind: 'embedded',
      entity: () => PersonName,
      prefix: false,
    },
    emergencyContact: {
      kind: 'embedded',
      entity: () => EmergencyContact,
      prefix: 'emergency_contact_',
      nullable: true,
    },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [PatientSchema, PersonNameSchema, EmergencyContactSchema],
  });
  await orm.schema.createSchema();

  await orm.em.insert(Patient, {
    id: '1',
    name: {
      givenName: 'John',
      surname: 'Doe',
    },
    emergencyContact: {
      name: {
        givenName: 'Jane',
        surname: 'Doe',
      },
      relationship: 'wife',
    },
  });
});
afterAll(() => orm.close());

test('#5642', async () => {
  const qb = orm.em.createQueryBuilder(Patient);
  qb.select(['*']).where({ id: '1' });
  const patient = await qb.execute('get', false);
  expect(patient).toEqual({
    id: '1',
    given_name: 'John',
    surname: 'Doe',
    emergency_contact_given_name: 'Jane',
    emergency_contact_surname: 'Doe',
    emergency_contact_relationship: 'wife',
  });
});
