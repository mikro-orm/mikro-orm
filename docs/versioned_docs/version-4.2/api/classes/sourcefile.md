---
id: "sourcefile"
title: "Class: SourceFile"
sidebar_label: "SourceFile"
---

## Hierarchy

* **SourceFile**

## Constructors

### constructor

\+ **new SourceFile**(`meta`: EntityMetadata, `namingStrategy`: NamingStrategy, `helper`: SchemaHelper): [SourceFile](sourcefile.md)

*Defined in [packages/entity-generator/src/SourceFile.ts:7](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L7)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`namingStrategy` | NamingStrategy |
`helper` | SchemaHelper |

**Returns:** [SourceFile](sourcefile.md)

## Properties

### coreImports

• `Private` `Readonly` **coreImports**: Set&#60;string> = new Set&#60;string>()

*Defined in [packages/entity-generator/src/SourceFile.ts:6](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L6)*

___

### entityImports

• `Private` `Readonly` **entityImports**: Set&#60;string> = new Set&#60;string>()

*Defined in [packages/entity-generator/src/SourceFile.ts:7](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L7)*

___

### helper

• `Private` `Readonly` **helper**: SchemaHelper

*Defined in [packages/entity-generator/src/SourceFile.ts:11](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L11)*

___

### meta

• `Private` `Readonly` **meta**: EntityMetadata

*Defined in [packages/entity-generator/src/SourceFile.ts:9](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L9)*

___

### namingStrategy

• `Private` `Readonly` **namingStrategy**: NamingStrategy

*Defined in [packages/entity-generator/src/SourceFile.ts:10](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L10)*

## Methods

### generate

▸ **generate**(): string

*Defined in [packages/entity-generator/src/SourceFile.ts:13](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L13)*

**Returns:** string

___

### getBaseName

▸ **getBaseName**(): string

*Defined in [packages/entity-generator/src/SourceFile.ts:53](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L53)*

**Returns:** string

___

### getCommonDecoratorOptions

▸ `Private`**getCommonDecoratorOptions**(`options`: [Dictionary](../index.md#dictionary), `prop`: EntityProperty, `columnType`: string \| undefined): void

*Defined in [packages/entity-generator/src/SourceFile.ts:123](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L123)*

#### Parameters:

Name | Type |
------ | ------ |
`options` | [Dictionary](../index.md#dictionary) |
`prop` | EntityProperty |
`columnType` | string \| undefined |

**Returns:** void

___

### getDecoratorType

▸ `Private`**getDecoratorType**(`prop`: EntityProperty): string

*Defined in [packages/entity-generator/src/SourceFile.ts:194](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L194)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |

**Returns:** string

___

### getForeignKeyDecoratorOptions

▸ `Private`**getForeignKeyDecoratorOptions**(`options`: [Dictionary](../index.md#dictionary), `prop`: EntityProperty): void

*Defined in [packages/entity-generator/src/SourceFile.ts:159](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L159)*

#### Parameters:

Name | Type |
------ | ------ |
`options` | [Dictionary](../index.md#dictionary) |
`prop` | EntityProperty |

**Returns:** void

___

### getPropertyDecorator

▸ `Private`**getPropertyDecorator**(`prop`: EntityProperty, `padLeft`: number): string

*Defined in [packages/entity-generator/src/SourceFile.ts:71](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L71)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`padLeft` | number |

**Returns:** string

___

### getPropertyDefinition

▸ `Private`**getPropertyDefinition**(`prop`: EntityProperty, `padLeft`: number): string

*Defined in [packages/entity-generator/src/SourceFile.ts:57](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L57)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`padLeft` | number |

**Returns:** string

___

### getPropertyIndexes

▸ `Private`**getPropertyIndexes**(`prop`: EntityProperty, `options`: [Dictionary](../index.md#dictionary)): string[]

*Defined in [packages/entity-generator/src/SourceFile.ts:95](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L95)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`options` | [Dictionary](../index.md#dictionary) |

**Returns:** string[]

___

### getScalarPropertyDecoratorOptions

▸ `Private`**getScalarPropertyDecoratorOptions**(`options`: [Dictionary](../index.md#dictionary), `prop`: EntityProperty, `columnType`: string \| undefined): void

*Defined in [packages/entity-generator/src/SourceFile.ts:143](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/entity-generator/src/SourceFile.ts#L143)*

#### Parameters:

Name | Type |
------ | ------ |
`options` | [Dictionary](../index.md#dictionary) |
`prop` | EntityProperty |
`columnType` | string \| undefined |

**Returns:** void
