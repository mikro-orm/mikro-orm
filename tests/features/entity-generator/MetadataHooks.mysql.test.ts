import {
  Cascade,
  EntityMetadata,
  GenerateOptions,
  JsonType,
  Platform,
  ReferenceKind,
  MetadataProcessor,
  TransformContext,
  Type,
  Utils,
  StringType,
  EntityProperty,
} from '@mikro-orm/core';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { initORMMySql } from '../../bootstrap.js';
import { Author2 } from '../../entities-sql/index.js';

// #region Extensions

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

      const managerProp = entity.properties.managerProp;
      managerProp.default = undefined;
      managerProp.optional = true;
    }

    if (entity.className === 'Author2') {
      entity.readonly = true;
      entity.addProperty({
        name: 'secondsSinceLastModified',
        fieldNames: [platform.getConfig().getNamingStrategy().propertyToColumnName('secondsSinceLastModified')],
        columnTypes: ['int'],
        type: 'integer',
        runtimeType: 'number',
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
          propOptions.type = 'EmailType';
          propOptions.runtimeType = 'Email';
          // force index definition via decorators
          if (typeof propOptions.index === 'string') {
            entity.indexes.push({ name: propOptions.index, properties: [ propOptions.name ] });
          }
          if (typeof propOptions.unique === 'string') {
            entity.uniques.push({ name: propOptions.unique, properties: [ propOptions.name ] });
          }
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
          propOptions.kind = ReferenceKind.EMBEDDED;
          propOptions.array = true;
          propOptions.object = true;
          propOptions.prefix = false;
          propOptions.type = 'IdentitiesContainer';
        }
      });
    }
  });

  const emailProp = virtualEntityBase.props.find(prop => prop.name === 'email')!;

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
  virtualEntityMeta.addProperty(structuredClone(virtualEntityBase.props.find(prop => prop.name === 'email'))!);
  const stringTypeOverride = new StringType();
  const emailPropOverride: EntityProperty = structuredClone(virtualEntityMeta.properties.email);
  emailPropOverride.nullable = true;
  stringTypeOverride.prop = emailPropOverride;
  virtualEntityMeta.properties.email.customTypes = [stringTypeOverride];
  metadata.push(virtualEntityMeta);
  emailProp.serializer = Utils.createFunction(new Map(), 'return (v) => EmailSerializer.anonymous(v);');

  const virtualEntityMeta2 = new EntityMetadata<any>({
    className: 'AuthorPartialView2',
    collection: platform.getConfig().getNamingStrategy().classToTableName('AuthorPartialView'),
    virtual: true,
    expression: (em: typeof orm.em) => em.createQueryBuilder<Author2>('Author2').select(['name', 'email']),
    comment: 'test',
  });
  const nameProp2 = Object.assign({}, virtualEntityBase.props.find(prop => prop.name === 'name')!);
  nameProp2.comment = 'author name also';
  nameProp2.onUpdate = owner => {
    owner.name += ' also';
  };
  virtualEntityMeta2.addProperty(nameProp2);
  const emailProp2 = Object.assign({}, virtualEntityBase.props.find(prop => prop.name === 'email')!);
  emailProp2.serializer = (email: string) => {
    const [localPart, hostnamePart] = email.split('@', 2);
    return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${hostnamePart}`;
  };
  emailProp2.hidden = false;
  emailProp2.customTypes = [stringTypeOverride];
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
      runtimeType: 'string',
      fieldNames: ['github'],
      type: 'string',
      columnTypes: ['varchar(255)'],
    },
  );
  embeddableEntityMeta.addProperty(
    {
      name: 'local',
      fieldNames: ['local'],
      columnTypes: ['int'],
      type: 'integer',
      runtimeType: 'number',
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
  metadata.push(companyOwner2def);

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

    if (entity.className === 'Book2') {
      entity.properties.publisher.mapToPk = true;

      entity.properties.uuidPk.type = 'uuid';
      entity.properties.uuidPk.customType = platform.getMappedType('uuid');

      const metaProp = entity.properties.meta;
      metaProp.kind = ReferenceKind.EMBEDDED;
      metaProp.type = 'MetaType';
      metaProp.object = true;
      metaProp.prefix = 'm';

      const fooProp = entity.properties.foo;
      fooProp.type = 'UrlType';
      fooProp.runtimeType = 'URL';
    }

    if (entity.className === 'FooBar2') {
      const objectProp = entity.properties.objectProperty;
      // Although it looks like a class name, this identifier is registered in the config,
      // under the getMappedType() override.
      // It should therefore be included as a string in the generated code.
      objectProp.type = 'JsonObjectType';
      objectProp.runtimeType = 'JSONObject';
    }

    if (entity.className === 'Publisher2') {
      const nameProp = entity.properties.name;
      nameProp.runtimeType = 'URL';
      nameProp.type = 'UrlTypeLike';
    }

    if (entity.className === 'User2') {
      entity.repositoryClass = 'Users2Repository';
      entity.properties.favouriteCar.mapToPk = true;
    }

    if (entity.className === 'Author2') {
      const authorToFriend = entity.properties.authorToFriend;
      expect(authorToFriend.kind).toBe(ReferenceKind.MANY_TO_MANY);
      authorToFriend.hidden = true;

      const authorInversed = entity.properties.book2Collection;
      authorInversed.orphanRemoval = true;
      entity.properties.secondsSinceLastModified.ref = false;

      const optionalProp = entity.properties.optional;
      expect(optionalProp.type).toBe('boolean');
      optionalProp.type = 'CustomBooleanType';
      optionalProp.runtimeType = 'CustomBooleanRuntimeType';

      const updatedAtProp = entity.properties.updatedAt;
      updatedAtProp.runtimeType = 'MyExtendedDataClass';
      updatedAtProp.serializer = v => v.toString();
      updatedAtProp.groups = ['test'];
      updatedAtProp.customType = new class extends Type<Date, string> {

        get runtimeType(): string {
          return 'string';
        }

      };
    }

    if (entity.className === 'BookTag2') {
      entity.props.forEach(prop => {
        if (
          prop.name === 'bookToTagUnorderedInverse' ||
          prop.name === 'book2TagsCollection'
        ) {
          prop.orderBy = { name: 'asc' };
        }
      });
    }
  });
};

class JsonObjectType extends JsonType {

  override convertToDatabaseValue(value: unknown, platform: Platform, context?: TransformContext): string | null {
    return super.convertToDatabaseValue(value, platform, context);
  }

  get runtimeType(): string {
    return 'object';
  }

}

class Email {

  private readonly parts: [string, string];

  constructor(email: string) {
    this.parts = email.split('@', 1) as [string, string];
  }

  getDomain() {
    return this.parts[1];
  }

  getLocal() {
    return this.parts[0];
  }

}

class EmailType extends Type<Email, string> {

  convertToJSValue(value: string, platform: Platform): Email {
    return new Email(value);
  }

  convertToDatabaseValue(value: Email, platform: Platform, context?: TransformContext): string {
    return `${value.getLocal()}@${value.getDomain()}`;
  }

}
class UrlType extends Type<URL, string> {

  convertToJSValue(value: string, platform: Platform): URL {
    return new URL(value);
  }

  convertToDatabaseValue(value: URL, platform: Platform, context?: TransformContext): string {
    return value.toString();
  }

}


const customImportResolver = (name: string, basePath: string, extension: string) => {
  return ({
    Book2: { path: `${basePath}/${name}${extension}`, name: 'Book2' },
    CustomBooleanType: { path: `${basePath}/../types/MyBoolean`, name: 'MyBoolean' },
    UrlTypeLike: { path: `${basePath}/../types/UrlTypeLike`, name: 'UrlTypeLike' },
    CustomBooleanRuntimeType: { path: '', name: `${basePath}/../runtimeTypes/BrandedTypes` },
    EmailSerializer: { path: `${basePath}/../serializers/Email`, name: '' },
    JSONObject: { path: `${basePath}/../runtimeTypes/JSONObject`, name: 'JSONObject' },
    Email: { path: `${basePath}/../runtimeTypes/Email`, name: 'default' },
    URL: { path: '', name: '' },
  })[name];
};

const getMappedTypeOverride = (type: string, platform: Platform) => {
  if (type === 'JsonObjectType') {
    return Type.getType(JsonObjectType);
  }
  if (type === 'EmailType') {
    return Type.getType(EmailType);
  }
  if (type === 'UrlType') {
    return Type.getType(UrlType);
  }
  return platform.getDefaultMappedType(type);
};

// #endregion

let orm: Awaited<ReturnType<typeof initORMMySql>>;

describe('MetadataHooks [mysql]', () => {

  beforeEach(async () => {
    orm = await initORMMySql('mysql', {
      discovery: {
        getMappedType: getMappedTypeOverride,
      },
      entityGenerator: {
        save: false,
        bidirectionalRelations: true,
        fileName: className => {
          if (className === 'Author2') {
            return 'subfolder/Author2';
          }
          return className;
        },
        onImport: customImportResolver,
        extraImports: (basePath, originFileName) => {
          if (originFileName === 'Author2.ts') {
            return ['EmailSerializer'];
          }
          return [];
        },
        onInitialMetadata: initialMetadataProcessor,
        onProcessedMetadata: processedMetadataProcessor,
      },
    });
  });

  afterEach(async () => {
    await orm.close(true);
  });

  describe.each([false, true])('forceUndefined=%s', forceUndefined => {

    beforeEach(async () => {
      orm.config.get('entityGenerator').forceUndefined = forceUndefined;
    });

    describe.each([false, true])('identifiedReferences=%s', identifiedReferences => {

      beforeEach(async () => {
        orm.config.get('entityGenerator').identifiedReferences = identifiedReferences;
      });

      test('metadata hooks with decorators', async () => {
        const dump = await orm.entityGenerator.generate({
          entitySchema: false,
          save: true,
          path: './temp/entities-metadata-hooks',
        });
        expect(dump).toMatchSnapshot('mysql-defaults-dump');
        expect(existsSync('./temp/entities-metadata-hooks/subfolder/Author2.ts')).toBe(true);
        expect(existsSync('./temp/entities-metadata-hooks/Book2.ts')).toBe(true);
        await rm('./temp/entities-metadata-hooks', { recursive: true, force: true });
      });

      test('metadata hooks with entity schema', async () => {
        const dump = await orm.entityGenerator.generate({
          entitySchema: true,
        });
        expect(dump).toMatchSnapshot('mysql-EntitySchema-dump');
      });
    });
  });
});
