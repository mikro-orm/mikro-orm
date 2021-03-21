---
id: "core.metadataerror"
title: "Class: MetadataError<T>"
sidebar_label: "MetadataError"
custom_edit_url: null
hide_title: true
---

# Class: MetadataError<T\>

[core](../modules/core.md).MetadataError

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity) | [*AnyEntity*](../modules/core.md#anyentity) |

## Hierarchy

* [*ValidationError*](core.validationerror.md)<T\>

  ↳ **MetadataError**

## Constructors

### constructor

\+ **new MetadataError**<T\>(`message`: *string*, `entity?`: T): [*MetadataError*](core.metadataerror.md)<T\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<any\> | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

#### Parameters:

Name | Type |
:------ | :------ |
`message` | *string* |
`entity?` | T |

**Returns:** [*MetadataError*](core.metadataerror.md)<T\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:4](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L4)

## Properties

### message

• **message**: *string*

Inherited from: [ValidationError](core.validationerror.md).[message](core.validationerror.md#message)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: *string*

Inherited from: [ValidationError](core.validationerror.md).[name](core.validationerror.md#name)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:973

___

### prepareStackTrace

• `Optional` **prepareStackTrace**: (`err`: Error, `stackTraces`: CallSite[]) => *any*

Optional override for formatting stack traces

**`see`** https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Type declaration:

▸ (`err`: Error, `stackTraces`: CallSite[]): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`err` | Error |
`stackTraces` | CallSite[] |

**Returns:** *any*

Defined in: node_modules/@types/node/globals.d.ts:11

Inherited from: [ValidationError](core.validationerror.md).[prepareStackTrace](core.validationerror.md#preparestacktrace)

Defined in: node_modules/@types/node/globals.d.ts:11

___

### stack

• `Optional` **stack**: *string*

Inherited from: [ValidationError](core.validationerror.md).[stack](core.validationerror.md#stack)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:975

___

### stackTraceLimit

• **stackTraceLimit**: *number*

Inherited from: [ValidationError](core.validationerror.md).[stackTraceLimit](core.validationerror.md#stacktracelimit)

Defined in: node_modules/@types/node/globals.d.ts:13

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`: *object*, `constructorOpt?`: Function): *void*

Create .stack property on a target object

#### Parameters:

Name | Type |
:------ | :------ |
`targetObject` | *object* |
`constructorOpt?` | Function |

**Returns:** *void*

Inherited from: [ValidationError](core.validationerror.md)

Defined in: node_modules/@types/node/globals.d.ts:4

___

### getEntity

▸ **getEntity**(): *undefined* \| [*AnyEntity*](../modules/core.md#anyentity)<any\>

Gets instance of entity that caused this error.

**Returns:** *undefined* \| [*AnyEntity*](../modules/core.md#anyentity)<any\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:17](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L17)

___

### cannotCommit

▸ `Static`**cannotCommit**(): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:96](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L96)

___

### cannotModifyInverseCollection

▸ `Static`**cannotModifyInverseCollection**(`owner`: [*AnyEntity*](../modules/core.md#anyentity)<any\>, `property`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`owner` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |
`property` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:79](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L79)

___

### cannotModifyReadonlyCollection

▸ `Static`**cannotModifyReadonlyCollection**(`owner`: [*AnyEntity*](../modules/core.md#anyentity)<any\>, `property`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`owner` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |
`property` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:88](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L88)

___

### cannotUseOperatorsInsideEmbeddables

▸ `Static`**cannotUseOperatorsInsideEmbeddables**(`className`: *string*, `propName`: *string*, `payload`: [*Dictionary*](../modules/core.md#dictionary)<any\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`className` | *string* |
`propName` | *string* |
`payload` | [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:100](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L100)

___

### conflictingPropertyName

▸ `Static`**conflictingPropertyName**(`className`: *string*, `name`: *string*, `embeddedName`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`className` | *string* |
`name` | *string* |
`embeddedName` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:207](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L207)

___

### duplicateEntityDiscovered

▸ `Static`**duplicateEntityDiscovered**(`paths`: *string*[]): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`paths` | *string*[] |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:195](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L195)

___

### entityNotFound

▸ `Static`**entityNotFound**(`name`: *string*, `path`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |
`path` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:166](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L166)

___

### entityNotManaged

▸ `Static`**entityNotManaged**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:43](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L43)

___

### fromCollectionNotInitialized

▸ `Static`**fromCollectionNotInitialized**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L28)

___

### fromMergeWithoutPK

▸ `Static`**fromMergeWithoutPK**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *void*

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:35](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L35)

___

### fromMessage

▸ `Private` `Static`**fromMessage**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `message`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`message` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:211](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L211)

___

### fromMissingPrimaryKey

▸ `Static`**fromMissingPrimaryKey**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:134](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L134)

___

### fromUnknownEntity

▸ `Static`**fromUnknownEntity**(`className`: *string*, `source`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`className` | *string* |
`source` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:183](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L183)

___

### fromWrongOwnership

▸ `Static`**fromWrongOwnership**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `key`: keyof [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`key` | keyof [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:154](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L154)

___

### fromWrongPropertyType

▸ `Static`**fromWrongPropertyType**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>, `property`: *string*, `expectedType`: *string*, `givenType`: *string*, `givenValue`: *string*): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |
`property` | *string* |
`expectedType` | *string* |
`givenType` | *string* |
`givenValue` | *string* |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:21](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L21)

___

### fromWrongReference

▸ `Static`**fromWrongReference**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `key`: keyof [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `owner?`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`key` | keyof [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`owner?` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:138](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L138)

___

### fromWrongReferenceType

▸ `Static`**fromWrongReferenceType**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `owner`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`owner` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:161](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L161)

___

### fromWrongTypeDefinition

▸ `Static`**fromWrongTypeDefinition**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:146](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L146)

___

### invalidCompositeIdentifier

▸ `Static`**invalidCompositeIdentifier**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:92](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L92)

___

### invalidEmbeddableQuery

▸ `Static`**invalidEmbeddableQuery**(`className`: *string*, `propName`: *string*, `embeddableType`: *string*): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`className` | *string* |
`propName` | *string* |
`embeddableType` | *string* |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:104](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L104)

___

### invalidPropertyName

▸ `Static`**invalidPropertyName**(`entityName`: *string*, `invalid`: *string*): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`invalid` | *string* |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:65](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L65)

___

### invalidType

▸ `Static`**invalidType**(`type`: [*Constructor*](../modules/core.md#constructor)<any\>, `value`: *any*, `mode`: *string*): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`type` | [*Constructor*](../modules/core.md#constructor)<any\> |
`value` | *any* |
`mode` | *string* |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:69](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L69)

___

### invalidVersionFieldType

▸ `Static`**invalidVersionFieldType**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:178](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L178)

___

### missingMetadata

▸ `Static`**missingMetadata**(`entity`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:203](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L203)

___

### multipleDecorators

▸ `Static`**multipleDecorators**(`entityName`: *string*, `propertyName`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`propertyName` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:199](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L199)

___

### multipleVersionFields

▸ `Static`**multipleVersionFields**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `fields`: *string*[]): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`fields` | *string*[] |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:174](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L174)

___

### noEntityDiscovered

▸ `Static`**noEntityDiscovered**(): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:187](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L187)

___

### notDiscoveredEntity

▸ `Static`**notDiscoveredEntity**(`data`: *any*, `meta?`: [*EntityMetadata*](core.entitymetadata.md)<any\>): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`data` | *any* |
`meta?` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:52](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L52)

___

### notEntity

▸ `Static`**notEntity**(`owner`: [*AnyEntity*](../modules/core.md#anyentity)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `data`: *any*): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`owner` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`data` | *any* |

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:47](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L47)

___

### onlyAbstractEntitiesDiscovered

▸ `Static`**onlyAbstractEntitiesDiscovered**(): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:191](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L191)

___

### transactionRequired

▸ `Static`**transactionRequired**(): [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

**Returns:** [*ValidationError*](core.validationerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Inherited from: [ValidationError](core.validationerror.md)

Defined in: [packages/core/src/errors.ts:39](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L39)

___

### unknownIndexProperty

▸ `Static`**unknownIndexProperty**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: *string*, `type`: *string*): [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | *string* |
`type` | *string* |

**Returns:** [*MetadataError*](core.metadataerror.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/errors.ts:170](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/errors.ts#L170)
