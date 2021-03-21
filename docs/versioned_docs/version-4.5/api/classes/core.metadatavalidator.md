---
id: "core.metadatavalidator"
title: "Class: MetadataValidator"
sidebar_label: "MetadataValidator"
custom_edit_url: null
hide_title: true
---

# Class: MetadataValidator

[core](../modules/core.md).MetadataValidator

## Constructors

### constructor

\+ **new MetadataValidator**(): [*MetadataValidator*](core.metadatavalidator.md)

**Returns:** [*MetadataValidator*](core.metadatavalidator.md)

## Methods

### validateBidirectional

▸ `Private`**validateBidirectional**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `metadata`: [*MetadataStorage*](core.metadatastorage.md)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataValidator.ts:75](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataValidator.ts#L75)

___

### validateDiscovered

▸ **validateDiscovered**(`discovered`: [*EntityMetadata*](core.entitymetadata.md)<any\>[], `warnWhenNoEntities`: *boolean*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`discovered` | [*EntityMetadata*](core.entitymetadata.md)<any\>[] |
`warnWhenNoEntities` | *boolean* |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataValidator.ts:39](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataValidator.ts#L39)

___

### validateEntityDefinition

▸ **validateEntityDefinition**(`metadata`: [*MetadataStorage*](core.metadatastorage.md), `name`: *string*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |
`name` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataValidator.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataValidator.ts#L20)

___

### validateIndexes

▸ `Private`**validateIndexes**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `indexes`: { `properties`: *string* \| *string*[]  }[], `type`: *index* \| *unique*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`indexes` | { `properties`: *string* \| *string*[]  }[] |
`type` | *index* \| *unique* |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataValidator.ts:133](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataValidator.ts#L133)

___

### validateInverseSide

▸ `Private`**validateInverseSide**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `owner`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `metadata`: [*MetadataStorage*](core.metadatastorage.md)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`owner` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataValidator.ts:105](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataValidator.ts#L105)

___

### validateOwningSide

▸ `Private`**validateOwningSide**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `inverse`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `metadata`: [*MetadataStorage*](core.metadatastorage.md)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`inverse` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataValidator.ts:85](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataValidator.ts#L85)

___

### validateReference

▸ `Private`**validateReference**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `metadata`: [*MetadataStorage*](core.metadatastorage.md)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataValidator.ts:63](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataValidator.ts#L63)

___

### validateVersionField

▸ `Private`**validateVersionField**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataValidator.ts:143](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataValidator.ts#L143)

___

### validateSingleDecorator

▸ `Static`**validateSingleDecorator**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `propertyName`: *string*, `reference`: [*ReferenceType*](../enums/core.referencetype.md)): *void*

Validate there is only one property decorator. This disallows using `@Property()` together with e.g. `@ManyToOne()`
on the same property. One should use only `@ManyToOne()` in such case.
We allow the existence of the property in metadata if the reference type is the same, this should allow things like HMR to work.

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`propertyName` | *string* |
`reference` | [*ReferenceType*](../enums/core.referencetype.md) |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataValidator.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataValidator.ts#L14)
