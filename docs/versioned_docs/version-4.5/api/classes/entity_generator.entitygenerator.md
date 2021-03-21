---
id: "entity_generator.entitygenerator"
title: "Class: EntityGenerator"
sidebar_label: "EntityGenerator"
custom_edit_url: null
hide_title: true
---

# Class: EntityGenerator

[entity-generator](../modules/entity_generator.md).EntityGenerator

## Constructors

### constructor

\+ **new EntityGenerator**(`em`: [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\>): [*EntityGenerator*](entity_generator.entitygenerator.md)

#### Parameters:

Name | Type |
:------ | :------ |
`em` | [*EntityManager*](knex.entitymanager.md)<[*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>\> |

**Returns:** [*EntityGenerator*](entity_generator.entitygenerator.md)

Defined in: [packages/entity-generator/src/EntityGenerator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/entity-generator/src/EntityGenerator.ts#L14)

## Properties

### config

• `Private` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/entity-generator/src/EntityGenerator.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/entity-generator/src/EntityGenerator.ts#L8)

___

### connection

• `Private` `Readonly` **connection**: [*AbstractSqlConnection*](knex.abstractsqlconnection.md)

Defined in: [packages/entity-generator/src/EntityGenerator.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/entity-generator/src/EntityGenerator.ts#L12)

___

### driver

• `Private` `Readonly` **driver**: [*AbstractSqlDriver*](knex.abstractsqldriver.md)<[*AbstractSqlConnection*](knex.abstractsqlconnection.md)\>

Defined in: [packages/entity-generator/src/EntityGenerator.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/entity-generator/src/EntityGenerator.ts#L9)

___

### helper

• `Private` `Readonly` **helper**: [*SchemaHelper*](knex.schemahelper.md)

Defined in: [packages/entity-generator/src/EntityGenerator.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/entity-generator/src/EntityGenerator.ts#L11)

___

### namingStrategy

• `Private` `Readonly` **namingStrategy**: [*NamingStrategy*](../interfaces/core.namingstrategy.md)

Defined in: [packages/entity-generator/src/EntityGenerator.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/entity-generator/src/EntityGenerator.ts#L13)

___

### platform

• `Private` `Readonly` **platform**: [*AbstractSqlPlatform*](knex.abstractsqlplatform.md)

Defined in: [packages/entity-generator/src/EntityGenerator.ts:10](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/entity-generator/src/EntityGenerator.ts#L10)

___

### sources

• `Private` `Readonly` **sources**: *SourceFile*[]

Defined in: [packages/entity-generator/src/EntityGenerator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/entity-generator/src/EntityGenerator.ts#L14)

## Methods

### createEntity

▸ **createEntity**(`table`: [*DatabaseTable*](knex.databasetable.md)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`table` | [*DatabaseTable*](knex.databasetable.md) |

**Returns:** *void*

Defined in: [packages/entity-generator/src/EntityGenerator.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/entity-generator/src/EntityGenerator.ts#L31)

___

### generate

▸ **generate**(`options?`: { `baseDir?`: *string* ; `save?`: *boolean*  }): *Promise*<string[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *object* |
`options.baseDir?` | *string* |
`options.save?` | *boolean* |

**Returns:** *Promise*<string[]\>

Defined in: [packages/entity-generator/src/EntityGenerator.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/entity-generator/src/EntityGenerator.ts#L18)
