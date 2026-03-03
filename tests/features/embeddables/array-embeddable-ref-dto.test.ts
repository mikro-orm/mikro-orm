import {
  BaseEntity,
  EntitySchema,
  EntityDTO,
  HiddenProps,
  MikroORM,
  type Ref,
  type EntityManager,
} from '@mikro-orm/sqlite';

class Base extends BaseEntity {
  [HiddenProps]!: 'id';
  id!: number;
}

const baseEntity = new EntitySchema({
  abstract: true,
  class: Base,
  name: 'Base',
  properties: {
    id: {
      primary: true,
      type: 'number',
    },
  },
});

class Person extends Base {
  firstName!: string;
}

const personEntity = new EntitySchema({
  class: Person,
  extends: baseEntity,
  name: 'Person',
  properties: {
    firstName: {
      index: true,
      type: 'string',
    },
  },
  tableName: 'persons',
});

interface DocumentTraveler {
  person: Ref<Person>;
  processedAt?: Date;
}

const documentTravelerEntity = new EntitySchema({
  embeddable: true,
  name: 'DocumentTraveler',
  properties: {
    person: {
      entity: () => personEntity,
      index: true,
      kind: 'm:1',
      ref: true,
    },
    processedAt: {
      nullable: true,
      type: 'datetime',
    },
  },
});

class Document extends Base {
  travelers!: DocumentTraveler[];
}

const documentEntity = new EntitySchema({
  class: Document,
  extends: baseEntity,
  name: 'Document',
  properties: {
    travelers: {
      array: true,
      entity: () => documentTravelerEntity,
      kind: 'embedded',
    },
  },
  tableName: 'documents',
});

describe('array embeddable with Ref in EntityDTO', () => {
  let orm: MikroORM;
  let em: EntityManager;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [baseEntity, personEntity, documentTravelerEntity, documentEntity],
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  beforeEach(() => {
    em = orm.em.fork();
  });

  test('Ref resolves to primary key when not populated', async () => {
    const person = em.create(personEntity, { firstName: 'John' });
    const document = em.create(documentEntity, {
      travelers: [{ person, processedAt: new Date() }],
    });

    await em.flush();
    em.clear();

    const foundDocument = await em.findOne(documentEntity, { id: document.id });

    expect(foundDocument).toBeDefined();
    const object = foundDocument!.toObject();

    // The type should be number (primary key), not Ref<Person>
    const travelerPerson = object.travelers[0]?.person;
    // This assignment verifies the type is number (primary key), not Ref<Person>
    const typeCheck: number | undefined = travelerPerson;
    expect(typeof typeCheck).toBe('number');
  });

  test('Ref resolves to EntityDTO when populated', async () => {
    const person = em.create(personEntity, { firstName: 'Jane' });
    const document = em.create(documentEntity, {
      travelers: [{ person, processedAt: new Date() }],
    });

    await em.flush();
    em.clear();

    const foundDocument = await em.findOne(
      documentEntity,
      { id: document.id },
      {
        populate: ['travelers.person'],
      },
    );

    expect(foundDocument).toBeDefined();
    const object = foundDocument!.toObject();

    // The type should be EntityDTO<Person>, not Ref<Person>
    const travelerPerson = object.travelers[0]?.person;
    // This assignment verifies the type is EntityDTO<Person>, not Ref<Person>
    const typeCheck: EntityDTO<Person> | undefined = travelerPerson;
    expect(typeCheck).toHaveProperty('firstName');
  });
});
