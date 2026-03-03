import { type Collection, EntitySchema, MikroORM } from '@mikro-orm/sqlite';

abstract class Base {
  id!: string;
}

const BaseSchema = new EntitySchema({
  abstract: true,
  class: Base,
  properties: {
    id: {
      primary: true,
      type: 'number',
    },
  },
});

class Person extends Base {
  documents?: Collection<Document>;
}

const PersonSchema = new EntitySchema({
  class: Person,
  extends: Base,
  properties: {
    documents: {
      entity: () => Document,
      kind: 'm:n',
      mappedBy: 'persons',
      nullable: true,
    },
  },
});

class DocumentDataBase {
  type!: string;
}

const DocumentDataBaseSchema = new EntitySchema({
  class: DocumentDataBase,
  embeddable: true,
  properties: {
    type: {
      type: 'string',
    },
  },
});

class DocumentDataIlOccupation {
  person!: Person;
}

const DocumentDataIlOccupationSchema = new EntitySchema({
  class: DocumentDataIlOccupation,
  embeddable: true,
  properties: {
    person: {
      entity: () => Person,
      kind: 'm:1',
    },
  },
});

class DocumentDataIlParent {
  person!: Person;
}

const DocumentDataIlParentSchema = new EntitySchema({
  class: DocumentDataIlParent,
  embeddable: true,
  properties: {
    person: {
      entity: () => Person,
      kind: 'm:1',
    },
  },
});

class DocumentDataIl extends DocumentDataBase {
  declare type: 'IL';

  occupations!: DocumentDataIlOccupation[];
  parents?: DocumentDataIlParent[];
}

const DocumentDataIlSchema = new EntitySchema({
  class: DocumentDataIl,
  discriminatorValue: 'IL',
  embeddable: true,
  extends: DocumentDataBase,
  properties: {
    occupations: {
      array: true,
      entity: () => DocumentDataIlOccupation,
      kind: 'embedded',
    },
    parents: {
      array: true,
      entity: () => DocumentDataIlParent,
      kind: 'embedded',
      nullable: true,
    },
  },
});

class DocumentDataTwVisa {
  person!: Person;
}

const DocumentDataTwVisaSchema = new EntitySchema({
  class: DocumentDataTwVisa,
  embeddable: true,
  properties: {
    person: {
      entity: () => Person,
      kind: 'm:1',
    },
  },
});

class DocumentDataTw extends DocumentDataBase {
  declare type: 'TW';
  visas!: DocumentDataTwVisa[];
}

const DocumentDataTwSchema = new EntitySchema({
  class: DocumentDataTw,
  discriminatorValue: 'TW',
  embeddable: true,
  extends: DocumentDataBase,
  properties: {
    visas: {
      array: true,
      entity: () => DocumentDataTwVisa,
      kind: 'embedded',
    },
  },
});

class Document extends Base {
  persons!: Collection<Person>;
  data!: DocumentDataIl | DocumentDataTw;
}

const DocumentSchema = new EntitySchema({
  class: Document,
  extends: Base,
  properties: {
    data: {
      entity: () => [DocumentDataIl, DocumentDataTw],
      kind: 'embedded',
      object: true,
    },
    persons: {
      entity: () => Person,
      inversedBy: 'documents',
      kind: 'm:n',
      owner: true,
    },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [
      BaseSchema,
      DocumentDataBaseSchema,
      DocumentDataIlOccupationSchema,
      DocumentDataIlParentSchema,
      DocumentDataIlSchema,
      DocumentDataTwSchema,
      DocumentDataTwVisaSchema,
      DocumentSchema,
      PersonSchema,
    ],
  });

  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('raw fragments with findAndCount', async () => {
  await orm.em.findAll(PersonSchema, {});
});
