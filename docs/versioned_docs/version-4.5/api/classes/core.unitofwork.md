---
id: "core.unitofwork"
title: "Class: UnitOfWork"
sidebar_label: "UnitOfWork"
custom_edit_url: null
hide_title: true
---

# Class: UnitOfWork

[core](../modules/core.md).UnitOfWork

## Constructors

### constructor

\+ **new UnitOfWork**(`em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): [*UnitOfWork*](core.unitofwork.md)

#### Parameters:

Name | Type |
:------ | :------ |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** [*UnitOfWork*](core.unitofwork.md)

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:32](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L32)

## Properties

### changeSetComputer

• `Private` `Readonly` **changeSetComputer**: [*ChangeSetComputer*](core.changesetcomputer.md)

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L30)

___

### changeSetPersister

• `Private` `Readonly` **changeSetPersister**: [*ChangeSetPersister*](core.changesetpersister.md)

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L31)

___

### changeSets

• `Private` `Readonly` **changeSets**: *Map*<[*AnyEntity*](../modules/core.md#anyentity)<any\>, [*ChangeSet*](core.changeset.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:23](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L23)

___

### collectionUpdates

• `Private` `Readonly` **collectionUpdates**: *Set*<[*Collection*](core.collection.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>, unknown\>\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L24)

___

### comparator

• `Private` `Readonly` **comparator**: [*EntityComparator*](core.entitycomparator.md)

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L29)

___

### eventManager

• `Private` `Readonly` **eventManager**: [*EventManager*](core.eventmanager.md)

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L28)

___

### extraUpdates

• `Private` `Readonly` **extraUpdates**: *Set*<[[*AnyEntity*](../modules/core.md#anyentity)<any\>, *string*, [*Reference*](core.reference.md)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Collection*](core.collection.md)<any, unknown\>]\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L25)

___

### identityMap

• `Private` `Readonly` **identityMap**: [*IdentityMap*](core.identitymap.md)

map of references to managed entities

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L18)

___

### metadata

• `Private` `Readonly` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:26](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L26)

___

### orphanRemoveStack

• `Private` `Readonly` **orphanRemoveStack**: *Set*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L22)

___

### persistStack

• `Private` `Readonly` **persistStack**: *Set*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L20)

___

### platform

• `Private` `Readonly` **platform**: [*Platform*](core.platform.md)

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:27](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L27)

___

### removeStack

• `Private` `Readonly` **removeStack**: *Set*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:21](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L21)

___

### working

• `Private` **working**: *boolean*= false

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:32](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L32)

## Methods

### cancelOrphanRemoval

▸ **cancelOrphanRemoval**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:323](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L323)

___

### cascade

▸ `Private`**cascade**<T\>(`entity`: T, `type`: [*Cascade*](../enums/core.cascade.md), `visited`: *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>, `options?`: { `checkRemoveStack?`: *boolean*  }): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`type` | [*Cascade*](../enums/core.cascade.md) |
`visited` | *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |
`options` | *object* |
`options.checkRemoveStack?` | *boolean* |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:459](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L459)

___

### cascadeReference

▸ `Private`**cascadeReference**<T\>(`entity`: T, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `type`: [*Cascade*](../enums/core.cascade.md), `visited`: *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>, `options`: { `checkRemoveStack?`: *boolean*  }): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`type` | [*Cascade*](../enums/core.cascade.md) |
`visited` | *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |
`options` | *object* |
`options.checkRemoveStack?` | *boolean* |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:477](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L477)

___

### checkOrphanRemoval

▸ `Private`**checkOrphanRemoval**<T\>(`changeSet`: [*ChangeSet*](core.changeset.md)<T\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:370](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L370)

___

### checkUniqueProps

▸ `Private`**checkUniqueProps**<T\>(`changeSet`: [*ChangeSet*](core.changeset.md)<T\>): *boolean*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |

**Returns:** *boolean*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:355](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L355)

___

### clear

▸ **clear**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:270](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L270)

___

### commit

▸ **commit**(): *Promise*<void\>

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:216](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L216)

___

### commitCreateChangeSets

▸ `Private`**commitCreateChangeSets**<T\>(`changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:613](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L613)

___

### commitDeleteChangeSets

▸ `Private`**commitDeleteChangeSets**<T\>(`changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:668](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L668)

___

### commitUpdateChangeSets

▸ `Private`**commitUpdateChangeSets**<T\>(`changeSets`: [*ChangeSet*](core.changeset.md)<T\>[], `ctx?`: *any*, `batched?`: *boolean*): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`changeSets` | [*ChangeSet*](core.changeset.md)<T\>[] | - |
`ctx?` | *any* | - |
`batched` | *boolean* | true |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:651](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L651)

___

### computeChangeSet

▸ **computeChangeSet**<T\>(`entity`: T): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:158](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L158)

___

### computeChangeSets

▸ **computeChangeSets**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:287](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L287)

___

### findExtraUpdates

▸ `Private`**findExtraUpdates**<T\>(`changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `props`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[]): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |
`props` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>[] |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:636](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L636)

___

### findNewEntities

▸ `Private`**findNewEntities**<T\>(`entity`: T, `visited?`: *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`visited` | *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:327](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L327)

___

### fixMissingReference

▸ `Private`**fixMissingReference**<T\>(`entity`: T, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:553](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L553)

___

### getById

▸ **getById**<T\>(`entityName`: *string*, `id`: [*Primary*](../modules/core.md#primary)<T\> \| [*Primary*](../modules/core.md#primary)<T\>[]): *undefined* \| T

Returns entity from the identity map. For composite keys, you need to pass an array of PKs in the same order as they are defined in `meta.primaryKeys`.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`id` | [*Primary*](../modules/core.md#primary)<T\> \| [*Primary*](../modules/core.md#primary)<T\>[] |

**Returns:** *undefined* \| T

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:87](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L87)

___

### getChangeSetGroups

▸ `Private`**getChangeSetGroups**(): *object*

Orders change sets so FK constrains are maintained, ensures stable order (needed for node < 11)

**Returns:** *object*

Name | Type |
:------ | :------ |
`create` |  |
`delete` |  |
`update` |  |

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:688](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L688)

___

### getChangeSets

▸ **getChangeSets**(): [*ChangeSet*](core.changeset.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>[]

**Returns:** [*ChangeSet*](core.changeset.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>[]

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:146](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L146)

___

### getCollectionUpdates

▸ **getCollectionUpdates**(): [*Collection*](core.collection.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>, unknown\>[]

**Returns:** [*Collection*](core.collection.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>, unknown\>[]

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:150](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L150)

___

### getCommitOrder

▸ `Private`**getCommitOrder**(): *string*[]

**Returns:** *string*[]

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:704](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L704)

___

### getExtraUpdates

▸ **getExtraUpdates**(): *Set*<[[*AnyEntity*](../modules/core.md#anyentity)<any\>, *string*, [*Reference*](core.reference.md)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Collection*](core.collection.md)<any, unknown\>]\>

**Returns:** *Set*<[[*AnyEntity*](../modules/core.md#anyentity)<any\>, *string*, [*Reference*](core.reference.md)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Collection*](core.collection.md)<any, unknown\>]\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:154](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L154)

___

### getIdentityMap

▸ **getIdentityMap**(): [*IdentityMap*](core.identitymap.md)

Returns map of all managed entities.

**Returns:** [*IdentityMap*](core.identitymap.md)

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:111](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L111)

___

### getOriginalEntityData

▸ **getOriginalEntityData**<T\>(): [*AnyEntity*](../modules/core.md#anyentity)<any\>[]

**`deprecated`** use `uow.getOriginalEntityData(entity)`

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

**Returns:** [*AnyEntity*](../modules/core.md#anyentity)<any\>[]

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:118](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L118)

▸ **getOriginalEntityData**<T\>(`entity`: T): *undefined* \| [*EntityData*](../modules/core.md#entitydata)<T\>

Returns stored snapshot of entity state that is used for change set computation.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |

**Returns:** *undefined* \| [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:123](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L123)

___

### getPersistStack

▸ **getPersistStack**(): *Set*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

**Returns:** *Set*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:138](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L138)

___

### getRemoveStack

▸ **getRemoveStack**(): *Set*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

**Returns:** *Set*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:142](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L142)

___

### initIdentifier

▸ `Private`**initIdentifier**<T\>(`entity`: T): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:385](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L385)

___

### isCollectionSelfReferenced

▸ `Private`**isCollectionSelfReferenced**(`collection`: [*Collection*](core.collection.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>, unknown\>, `visited`: *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`collection` | [*Collection*](core.collection.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>, unknown\> |
`visited` | *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |

**Returns:** *boolean*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:505](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L505)

___

### lock

▸ **lock**<T\>(`entity`: T, `mode`: [*LockMode*](../enums/core.lockmode.md), `version?`: *number* \| Date): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`mode` | [*LockMode*](../enums/core.lockmode.md) |
`version?` | *number* \| Date |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:256](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L256)

___

### lockOptimistic

▸ `Private`**lockOptimistic**<T\>(`entity`: T, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `version`: *number* \| Date): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`version` | *number* \| Date |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:531](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L531)

___

### lockPessimistic

▸ `Private`**lockPessimistic**<T\>(`entity`: T, `mode`: [*LockMode*](../enums/core.lockmode.md)): *Promise*<void\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`mode` | [*LockMode*](../enums/core.lockmode.md) |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:523](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L523)

___

### merge

▸ **merge**<T\>(`entity`: T, `visited?`: *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`visited?` | *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:36](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L36)

___

### persist

▸ **persist**<T\>(`entity`: T, `visited?`: *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>, `checkRemoveStack?`: *boolean*): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`entity` | T | - |
`visited` | *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> | - |
`checkRemoveStack` | *boolean* | false |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:189](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L189)

___

### persistToDatabase

▸ `Private`**persistToDatabase**(`groups`: { `create`:  ; `delete`:  ; `update`:   }, `tx?`: *any*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`groups` | *object* |
`groups.create` | - |
`groups.delete` | - |
`groups.update` | - |
`tx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:569](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L569)

___

### postCommitCleanup

▸ `Private`**postCommitCleanup**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:449](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L449)

___

### processReference

▸ `Private`**processReference**<T\>(`parent`: T, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `reference`: *any*, `visited`: *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`parent` | T |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |
`reference` | *any* |
`visited` | *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:395](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L395)

___

### processToManyReference

▸ `Private`**processToManyReference**<T\>(`reference`: [*Collection*](core.collection.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>, unknown\>, `visited`: *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>, `parent`: T, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`reference` | [*Collection*](core.collection.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>, unknown\> |
`visited` | *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |
`parent` | T |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:413](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L413)

___

### processToOneReference

▸ `Private`**processToOneReference**<T\>(`reference`: *any*, `visited`: *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`reference` | *any* |
`visited` | *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:407](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L407)

___

### recomputeSingleChangeSet

▸ **recomputeSingleChangeSet**<T\>(`entity`: T): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:172](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L172)

___

### registerManaged

▸ **registerManaged**<T\>(`entity`: T, `data?`: [*EntityData*](../modules/core.md#entitydata)<T\>, `refresh?`: *boolean*, `newEntity?`: *boolean*): T

**`internal`** 

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`data?` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`refresh?` | *boolean* |
`newEntity?` | *boolean* |

**Returns:** T

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:66](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L66)

___

### remove

▸ **remove**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>, `visited?`: *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |
`visited` | *WeakSet*<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:203](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L203)

___

### runHooks

▸ `Private`**runHooks**<T\>(`type`: [*EventType*](../enums/core.eventtype.md), `changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `sync?`: *boolean*): *Promise*<unknown\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`type` | [*EventType*](../enums/core.eventtype.md) | - |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> | - |
`sync` | *boolean* | false |

**Returns:** *Promise*<unknown\>

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:426](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L426)

___

### scheduleExtraUpdate

▸ **scheduleExtraUpdate**<T\>(`changeSet`: [*ChangeSet*](core.changeset.md)<T\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>): *void*

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`changeSet` | [*ChangeSet*](core.changeset.md)<T\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:311](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L311)

___

### scheduleOrphanRemoval

▸ **scheduleOrphanRemoval**(`entity?`: [*AnyEntity*](../modules/core.md#anyentity)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`entity?` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:317](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L317)

___

### shouldCascade

▸ `Private`**shouldCascade**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `type`: [*Cascade*](../enums/core.cascade.md)): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`type` | [*Cascade*](../enums/core.cascade.md) |

**Returns:** *boolean*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:510](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L510)

___

### tryGetById

▸ **tryGetById**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `strict?`: *boolean*): *null* \| T

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`entityName` | *string* | - |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> | - |
`strict` | *boolean* | true |

**Returns:** *null* \| T

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:98](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L98)

___

### unsetIdentity

▸ **unsetIdentity**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/UnitOfWork.ts:275](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/unit-of-work/UnitOfWork.ts#L275)
