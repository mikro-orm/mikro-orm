---
id: "entitygenerator"
title: "Class: EntityGenerator"
sidebar_label: "EntityGenerator"
---

## Hierarchy

* **EntityGenerator**

## Constructors

### constructor

\+ **new EntityGenerator**(`em`: [EntityManager](entitymanager.md)): [EntityGenerator](entitygenerator.md)

*Defined in [packages/entity-generator/src/EntityGenerator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L14)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |

**Returns:** [EntityGenerator](entitygenerator.md)

## Properties

### config

• `Private` `Readonly` **config**: Configuration&#60;IDatabaseDriver&#60;Connection>> = this.em.config

*Defined in [packages/entity-generator/src/EntityGenerator.ts:8](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L8)*

___

### connection

• `Private` `Readonly` **connection**: AbstractSqlConnection = this.driver.getConnection()

*Defined in [packages/entity-generator/src/EntityGenerator.ts:12](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L12)*

___

### driver

• `Private` `Readonly` **driver**: AbstractSqlDriver&#60;AbstractSqlConnection> = this.em.getDriver()

*Defined in [packages/entity-generator/src/EntityGenerator.ts:9](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L9)*

___

### em

• `Private` `Readonly` **em**: [EntityManager](entitymanager.md)

*Defined in [packages/entity-generator/src/EntityGenerator.ts:16](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L16)*

___

### helper

• `Private` `Readonly` **helper**: SchemaHelper = this.platform.getSchemaHelper()!

*Defined in [packages/entity-generator/src/EntityGenerator.ts:11](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L11)*

___

### namingStrategy

• `Private` `Readonly` **namingStrategy**: NamingStrategy = this.config.getNamingStrategy()

*Defined in [packages/entity-generator/src/EntityGenerator.ts:13](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L13)*

___

### platform

• `Private` `Readonly` **platform**: AbstractSqlPlatform = this.driver.getPlatform()

*Defined in [packages/entity-generator/src/EntityGenerator.ts:10](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L10)*

___

### sources

• `Private` `Readonly` **sources**: [SourceFile](sourcefile.md)[] = []

*Defined in [packages/entity-generator/src/EntityGenerator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L14)*

## Methods

### createEntity

▸ **createEntity**(`table`: DatabaseTable): void

*Defined in [packages/entity-generator/src/EntityGenerator.ts:31](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L31)*

#### Parameters:

Name | Type |
------ | ------ |
`table` | DatabaseTable |

**Returns:** void

___

### generate

▸ **generate**(`options?`: { baseDir?: string ; save?: boolean  }): Promise&#60;string[]>

*Defined in [packages/entity-generator/src/EntityGenerator.ts:18](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/entity-generator/src/EntityGenerator.ts#L18)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`options` | { baseDir?: string ; save?: boolean  } | {} |

**Returns:** Promise&#60;string[]>
