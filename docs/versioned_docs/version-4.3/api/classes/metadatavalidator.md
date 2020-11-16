---
id: "metadatavalidator"
title: "Class: MetadataValidator"
sidebar_label: "MetadataValidator"
---

## Hierarchy

* **MetadataValidator**

## Methods

### validateBidirectional

▸ `Private`**validateBidirectional**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md), `metadata`: [MetadataStorage](metadatastorage.md)): void

*Defined in [packages/core/src/metadata/MetadataValidator.ts:80](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataValidator.ts#L80)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`metadata` | [MetadataStorage](metadatastorage.md) |

**Returns:** void

___

### validateDiscovered

▸ **validateDiscovered**(`discovered`: [EntityMetadata](entitymetadata.md)[], `warnWhenNoEntities`: boolean): void

*Defined in [packages/core/src/metadata/MetadataValidator.ts:39](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataValidator.ts#L39)*

#### Parameters:

Name | Type |
------ | ------ |
`discovered` | [EntityMetadata](entitymetadata.md)[] |
`warnWhenNoEntities` | boolean |

**Returns:** void

___

### validateEntityDefinition

▸ **validateEntityDefinition**(`metadata`: [MetadataStorage](metadatastorage.md), `name`: string): void

*Defined in [packages/core/src/metadata/MetadataValidator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataValidator.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [MetadataStorage](metadatastorage.md) |
`name` | string |

**Returns:** void

___

### validateIndexes

▸ `Private`**validateIndexes**(`meta`: [EntityMetadata](entitymetadata.md), `indexes`: { properties: string \| string[]  }[], `type`: &#34;index&#34; \| &#34;unique&#34;): void

*Defined in [packages/core/src/metadata/MetadataValidator.ts:127](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataValidator.ts#L127)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`indexes` | { properties: string \| string[]  }[] |
`type` | &#34;index&#34; \| &#34;unique&#34; |

**Returns:** void

___

### validateInverseSide

▸ `Private`**validateInverseSide**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md), `owner`: [EntityProperty](../interfaces/entityproperty.md), `metadata`: [MetadataStorage](metadatastorage.md)): void

*Defined in [packages/core/src/metadata/MetadataValidator.ts:110](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataValidator.ts#L110)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`owner` | [EntityProperty](../interfaces/entityproperty.md) |
`metadata` | [MetadataStorage](metadatastorage.md) |

**Returns:** void

___

### validateOwningSide

▸ `Private`**validateOwningSide**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md), `inverse`: [EntityProperty](../interfaces/entityproperty.md), `metadata`: [MetadataStorage](metadatastorage.md)): void

*Defined in [packages/core/src/metadata/MetadataValidator.ts:90](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataValidator.ts#L90)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`inverse` | [EntityProperty](../interfaces/entityproperty.md) |
`metadata` | [MetadataStorage](metadatastorage.md) |

**Returns:** void

___

### validateReference

▸ `Private`**validateReference**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md), `metadata`: [MetadataStorage](metadatastorage.md)): void

*Defined in [packages/core/src/metadata/MetadataValidator.ts:68](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataValidator.ts#L68)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`metadata` | [MetadataStorage](metadatastorage.md) |

**Returns:** void

___

### validateVersionField

▸ `Private`**validateVersionField**(`meta`: [EntityMetadata](entitymetadata.md)): void

*Defined in [packages/core/src/metadata/MetadataValidator.ts:137](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataValidator.ts#L137)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### validateSingleDecorator

▸ `Static`**validateSingleDecorator**(`meta`: [EntityMetadata](entitymetadata.md), `propertyName`: string, `reference`: [ReferenceType](../enums/referencetype.md)): void

*Defined in [packages/core/src/metadata/MetadataValidator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataValidator.ts#L14)*

Validate there is only one property decorator. This disallows using `@Property()` together with e.g. `@ManyToOne()`
on the same property. One should use only `@ManyToOne()` in such case.
We allow the existence of the property in metadata if the reference type is the same, this should allow things like HMR to work.

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`propertyName` | string |
`reference` | [ReferenceType](../enums/referencetype.md) |

**Returns:** void
