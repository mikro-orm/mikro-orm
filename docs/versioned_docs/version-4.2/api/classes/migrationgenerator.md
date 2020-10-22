---
id: "migrationgenerator"
title: "Class: MigrationGenerator"
sidebar_label: "MigrationGenerator"
---

## Hierarchy

* **MigrationGenerator**

## Constructors

### constructor

\+ **new MigrationGenerator**(`driver`: AbstractSqlDriver, `namingStrategy`: NamingStrategy, `options`: [MigrationsOptions](../index.md#migrationsoptions)): [MigrationGenerator](migrationgenerator.md)

*Defined in [packages/migrations/src/MigrationGenerator.ts:5](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationGenerator.ts#L5)*

#### Parameters:

Name | Type |
------ | ------ |
`driver` | AbstractSqlDriver |
`namingStrategy` | NamingStrategy |
`options` | [MigrationsOptions](../index.md#migrationsoptions) |

**Returns:** [MigrationGenerator](migrationgenerator.md)

## Properties

### driver

• `Protected` `Readonly` **driver**: AbstractSqlDriver

*Defined in [packages/migrations/src/MigrationGenerator.ts:7](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationGenerator.ts#L7)*

___

### namingStrategy

• `Protected` `Readonly` **namingStrategy**: NamingStrategy

*Defined in [packages/migrations/src/MigrationGenerator.ts:8](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationGenerator.ts#L8)*

___

### options

• `Protected` `Readonly` **options**: [MigrationsOptions](../index.md#migrationsoptions)

*Defined in [packages/migrations/src/MigrationGenerator.ts:9](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationGenerator.ts#L9)*

## Methods

### createStatement

▸ **createStatement**(`sql`: string, `padLeft`: number): string

*Defined in [packages/migrations/src/MigrationGenerator.ts:30](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationGenerator.ts#L30)*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | string |
`padLeft` | number |

**Returns:** string

___

### generate

▸ **generate**(`diff`: string[], `path?`: string): Promise&#60;[string, string]>

*Defined in [packages/migrations/src/MigrationGenerator.ts:11](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationGenerator.ts#L11)*

#### Parameters:

Name | Type |
------ | ------ |
`diff` | string[] |
`path?` | string |

**Returns:** Promise&#60;[string, string]>

___

### generateJSMigrationFile

▸ **generateJSMigrationFile**(`className`: string, `diff`: string[]): string

*Defined in [packages/migrations/src/MigrationGenerator.ts:39](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationGenerator.ts#L39)*

#### Parameters:

Name | Type |
------ | ------ |
`className` | string |
`diff` | string[] |

**Returns:** string

___

### generateTSMigrationFile

▸ **generateTSMigrationFile**(`className`: string, `diff`: string[]): string

*Defined in [packages/migrations/src/MigrationGenerator.ts:53](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/migrations/src/MigrationGenerator.ts#L53)*

#### Parameters:

Name | Type |
------ | ------ |
`className` | string |
`diff` | string[] |

**Returns:** string
