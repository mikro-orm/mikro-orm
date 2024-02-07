import { Cascade, EntityMetadata, GenerateOptions, Platform, ReferenceKind, MetadataProcessor } from '@mikro-orm/core';
import { initORMMySql } from '../../bootstrap';
import { Author2 } from '../../entities-sql';

const initialMetadataProcessor: MetadataProcessor = (metadata, platform) => {
  expect(platform).toBeInstanceOf(Platform);
  expect(Array.isArray(metadata)).toBe(true);

  const virtualEntityBase = metadata.find(entity => entity.className === 'Author2')!;
  expect(virtualEntityBase).not.toBeFalsy();

  metadata.forEach(entity => {
    expect(entity.virtual).toBeFalsy();
    expect(entity.embeddable).toBeFalsy();

    if (entity.className === 'Test2') {
      entity.properties.version.version = true;
    }

    if (entity.className === 'BaseUser2') {
      entity.abstract = true;
      entity.extends = 'CustomBase2';
      entity.discriminatorColumn = 'type';
      entity.discriminatorMap = {
        employee: 'Employee2',
        manager: 'Manager2',
      };
    }

    if (entity.className === 'Author2') {
      entity.readonly = true;
      entity.addProperty({
        name: 'secondsSinceLastModified',
        fieldNames: [platform.getConfig().getNamingStrategy().propertyToColumnName('secondsSinceLastModified')],
        columnTypes: ['int'],
        type: 'number',
        lazy: true,
        formula: alias => `TIMESTAMPDIFF(SECONDS, NOW(), ${alias}.updated_at)`,
      });
      Object.entries(entity.properties).forEach(propEntry => {
        const [propName, propOptions] = propEntry;
        expect(propOptions.kind).not.toBe(ReferenceKind.MANY_TO_MANY);

        if (propName === 'createdAt') {
          propOptions.hidden = true;
        }
        if (propName === 'email') {
          propOptions.hidden = true;
        }
        if (propName === 'termsAccepted') {
          propOptions.lazy = true;
        }
        if (propName === 'favouriteBook') {
          propOptions.eager = true;
          propOptions.cascade = [Cascade.PERSIST, Cascade.MERGE];
        }

        if (propName === 'age') {
          propOptions.concurrencyCheck = true;
        }

        if (propName === 'identity') {
          propOptions.prefix = false;
          propOptions.kind = ReferenceKind.EMBEDDED;
          propOptions.object = true;
          propOptions.array = true;
          propOptions.type = 'IdentitiesContainer';
        }
      });
    }
  });

  const virtualEntityMeta = new EntityMetadata<any>({
    className: 'AuthorPartialView',
    collection: platform.getConfig().getNamingStrategy().classToTableName('AuthorPartialView'),
    virtual: true,
    expression: 'SELECT name, email FROM author2',
    comment: 'test',
  });
  const nameProp = virtualEntityBase.props.find(prop => prop.name === 'name')!;
  nameProp.comment = 'author name';
  virtualEntityMeta.addProperty(nameProp);
  virtualEntityMeta.addProperty(virtualEntityBase.props.find(prop => prop.name === 'email')!);
  metadata.push(virtualEntityMeta);

  const virtualEntityMeta2 = new EntityMetadata<any>({
    className: 'AuthorPartialView2',
    collection: platform.getConfig().getNamingStrategy().classToTableName('AuthorPartialView'),
    virtual: true,
    expression: (em: typeof orm.em) => em.createQueryBuilder<Author2>('Author2').select(['name', 'email']),
    comment: 'test',
  });
  const nameProp2 = Object.assign({}, virtualEntityBase.props.find(prop => prop.name === 'name')!);
  nameProp2.comment = 'author name also';
  nameProp2.onUpdate = owner => { owner.name += ' also'; };
  virtualEntityMeta2.addProperty(nameProp2);
  const emailProp2 = Object.assign({}, virtualEntityBase.props.find(prop => prop.name === 'email')!);
  emailProp2.serializer = (email: string) => {
    const [localPart, hostnamePart] = email.split('@', 2);
    return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${hostnamePart}`;
  };
  emailProp2.hidden = false;
  emailProp2.serializedName = 'anonymizedEmail';
  virtualEntityMeta2.addProperty(emailProp2);
  metadata.push(virtualEntityMeta2);

  const embeddableEntityMeta = new EntityMetadata({
    className: 'IdentitiesContainer',
    collection: platform.getConfig().getNamingStrategy().classToTableName('IdentitiesContainer'),
    embeddable: true,
  });
  embeddableEntityMeta.addProperty(
    {
      name: 'github',
      type: 'string',
      fieldNames: ['github'],
      columnTypes: ['varchar(255)'],
    },
  );
  embeddableEntityMeta.addProperty(
    {
      name: 'local',
      fieldNames: ['local'],
      columnTypes: ['int'],
      type: 'number',
    },
  );
  metadata.push(embeddableEntityMeta);

  const employee2def = new EntityMetadata({
    className: 'Employee2',
    extends: 'BaseUser2',
    collection: platform.getConfig().getNamingStrategy().classToTableName('Employee2'),
    virtual: true,
    relations: [],
  });
  metadata.push(employee2def);

  const manager2def = new EntityMetadata({
    className: 'Manager2',
    extends: 'BaseUser2',
    collection: platform.getConfig().getNamingStrategy().classToTableName('Manager2'),
    virtual: true,
    relations: [],
  });
  metadata.push(manager2def);

  const companyOwner2def = new EntityMetadata({
    className: 'CompanyOwner2',
    extends: 'BaseUser2',
    discriminatorValue: 'owner',
    collection: platform.getConfig().getNamingStrategy().classToTableName('CompanyOwner2'),
    virtual: true,
    relations: [],
  });

  const customBase2 = new EntityMetadata({
    className: 'CustomBase2',
    abstract: true,
    virtual: true,
    relations: [],
  });
  metadata.push(customBase2);
};

const processedMetadataProcessor: GenerateOptions['onProcessedMetadata'] = (metadata, platform) => {
  metadata.forEach(entity => {
    if (['AuthorPartialView', 'AuthorPartialView2', 'CustomBase2', 'Employee2', 'Manager2', 'CompanyOwner2'].includes(entity.className)) {
      expect(entity.virtual).toBe(true);
    } else if (entity.className === 'IdentitiesContainer') {
      expect(entity.embeddable).toBe(true);
    } else {
      expect(entity.virtual).toBeFalsy();
      expect(entity.embeddable).toBeFalsy();
    }

    if (entity.className === 'Author2') {
      const authorToFriend = entity.properties.authorToFriend;
      expect(authorToFriend.kind).toBe(ReferenceKind.MANY_TO_MANY);
      authorToFriend.hidden = true;

      const authorInversed = entity.properties.authorInverse;
      authorInversed.orphanRemoval = true;
    }
  });
};

let orm: Awaited<ReturnType<typeof initORMMySql>>;

describe('MetadataHooks [mysql]', () => {

  beforeEach(async () => {
    orm = await initORMMySql();
  });

  afterEach(async () => {
    await orm.close(true);
  });

  test('metadata hooks with decorators', async () => {
    const dump = await orm.entityGenerator.generate({
      save: false,
      bidirectionalRelations: true,
      onInitialMetadata: initialMetadataProcessor,
      onProcessedMetadata: processedMetadataProcessor,
    });
    expect(dump).toMatchSnapshot('mysql-defaults-dump');
  });

  test('metadata hooks with entity schema', async () => {
    const dump = await orm.entityGenerator.generate({
      save: false,
      bidirectionalRelations: true,
      entitySchema: true,
      onInitialMetadata: initialMetadataProcessor,
      onProcessedMetadata: processedMetadataProcessor,
    });
    expect(dump).toMatchSnapshot('mysql-EntitySchema-dump');
  });
});
