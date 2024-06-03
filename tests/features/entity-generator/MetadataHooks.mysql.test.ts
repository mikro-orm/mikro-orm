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
} from '@mikro-orm/core';
import { initORMMySql } from '../../bootstrap';
import { Author2 } from '../../entities-sql';

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
      metaProp.runtimeType = 'MetaType';
    }

    if (entity.className === 'FooBar2') {
      const objectProp = entity.properties.objectProperty;
      // Although it looks like a class name, this identifier is registered in the config,
      // under the getMappedType() override.
      // It should therefore be included as a string in the generated code.
      objectProp.type = 'JsonObjectType';
      objectProp.runtimeType = 'JSONObject';
    }

    if (entity.className === 'User2') {
      entity.properties.favouriteCar.mapToPk = true;
    }

    if (entity.className === 'Author2') {
      const authorToFriend = entity.properties.authorToFriend;
      expect(authorToFriend.kind).toBe(ReferenceKind.MANY_TO_MANY);
      authorToFriend.hidden = true;

      const authorInversed = entity.properties.authorInverse;
      authorInversed.orphanRemoval = true;
      entity.properties.secondsSinceLastModified.ref = false;

      const optionalProp = entity.properties.optional;
      expect(optionalProp.type).toBe('boolean');
      optionalProp.type = 'CustomBooleanType';
      optionalProp.runtimeType = 'CustomBooleanRuntimeType';

      const emailProp = entity.properties.email;
      emailProp.type = 'EmailType';
      emailProp.runtimeType = 'Email';

      const updatedAtProp = entity.properties.updatedAt;
      updatedAtProp.runtimeType = 'MyExtendedDataClass';
      updatedAtProp.serializer = v => v.toString();
      updatedAtProp.customType = new class extends Type<Date, string> {

        get runtimeType(): string {
          return 'string';
        }

};
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

const customFileNameResolver = (name: string) => {
  return ({
    CustomBooleanType: '../types/CustomBooleanType',
    CustomBooleanRuntimeType: '../runtimeTypes/CustomBooleanRuntimeType',
    JSONObject: '../runtimeTypes/JSONObject',
    Email: '../runtimeTypes/Email',
  })[name] ?? name;
};

const getMappedTypeOverride = (type: string, platform: Platform) => {
  if (type === 'JsonObjectType') {
    return Type.getType(JsonObjectType);
  }
  if (type === 'EmailType') {
    return Type.getType(EmailType);
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
        fileName: customFileNameResolver,
        onInitialMetadata: initialMetadataProcessor,
        onProcessedMetadata: processedMetadataProcessor,
      },
    });
  });

  afterEach(async () => {
    await orm.close(true);
  });

  describe.each([false, true])('identifiedReferences=%s', identifiedReferences => {

    beforeEach(async () => {
      orm.config.get('entityGenerator').identifiedReferences = identifiedReferences;
    });

    test('metadata hooks with decorators', async () => {
      const dump = await orm.entityGenerator.generate({
        entitySchema: false,
      });
      expect(dump).toMatchSnapshot('mysql-defaults-dump');
    });

    test('metadata hooks with entity schema', async () => {
      const dump = await orm.entityGenerator.generate({
        entitySchema: true,
      });
      expect(dump).toMatchSnapshot('mysql-EntitySchema-dump');
    });

  });
});
