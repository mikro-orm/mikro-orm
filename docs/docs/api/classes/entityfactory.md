---
id: "entityfactory"
title: "Class: EntityFactory"
sidebar_label: "EntityFactory"
---

## Hierarchy

* **EntityFactory**

## Constructors

### constructor

\+ **new EntityFactory**(`unitOfWork`: [UnitOfWork](unitofwork.md), `em`: [EntityManager](entitymanager.md)): [EntityFactory](entityfactory.md)

*Defined in [packages/core/src/entity/EntityFactory.ts:22](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L22)*

#### Parameters:

Name | Type |
------ | ------ |
`unitOfWork` | [UnitOfWork](unitofwork.md) |
`em` | [EntityManager](entitymanager.md) |

**Returns:** [EntityFactory](entityfactory.md)

## Properties

### config

• `Private` `Readonly` **config**: [Configuration](configuration.md)&#60;[IDatabaseDriver](../interfaces/idatabasedriver.md)&#60;[Connection](connection.md)>> = this.em.config

*Defined in [packages/core/src/entity/EntityFactory.ts:19](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L19)*

___

### driver

• `Private` `Readonly` **driver**: [IDatabaseDriver](../interfaces/idatabasedriver.md)&#60;[Connection](connection.md)> = this.em.getDriver()

*Defined in [packages/core/src/entity/EntityFactory.ts:17](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L17)*

___

### em

• `Private` `Readonly` **em**: [EntityManager](entitymanager.md)

*Defined in [packages/core/src/entity/EntityFactory.ts:25](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L25)*

___

### eventManager

• `Private` `Readonly` **eventManager**: [EventManager](eventmanager.md) = this.em.getEventManager()

*Defined in [packages/core/src/entity/EntityFactory.ts:22](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L22)*

___

### hydrator

• `Private` `Readonly` **hydrator**: [IHydrator](../interfaces/ihydrator.md) = this.config.getHydrator(this.metadata)

*Defined in [packages/core/src/entity/EntityFactory.ts:21](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L21)*

___

### metadata

• `Private` `Readonly` **metadata**: [MetadataStorage](metadatastorage.md) = this.em.getMetadata()

*Defined in [packages/core/src/entity/EntityFactory.ts:20](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L20)*

___

### platform

• `Private` `Readonly` **platform**: [Platform](platform.md) = this.driver.getPlatform()

*Defined in [packages/core/src/entity/EntityFactory.ts:18](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L18)*

___

### unitOfWork

• `Private` `Readonly` **unitOfWork**: [UnitOfWork](unitofwork.md)

*Defined in [packages/core/src/entity/EntityFactory.ts:24](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L24)*

## Methods

### create

▸ **create**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `options?`: [FactoryOptions](../interfaces/factoryoptions.md)): [New](../index.md#new)&#60;T, P>

*Defined in [packages/core/src/entity/EntityFactory.ts:27](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L27)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> | - |
`data` | [EntityData](../index.md#entitydata)&#60;T> | - |
`options` | [FactoryOptions](../interfaces/factoryoptions.md) | {} |

**Returns:** [New](../index.md#new)&#60;T, P>

___

### createEntity

▸ `Private`**createEntity**&#60;T>(`data`: [EntityData](../index.md#entitydata)&#60;T>, `meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `options`: [FactoryOptions](../interfaces/factoryoptions.md)): T

*Defined in [packages/core/src/entity/EntityFactory.ts:87](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L87)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`options` | [FactoryOptions](../interfaces/factoryoptions.md) |

**Returns:** T

___

### createReference

▸ **createReference**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `id`: [Primary](../index.md#primary)&#60;T> \| [Primary](../index.md#primary)&#60;T>[] \| Record&#60;string, [Primary](../index.md#primary)&#60;T>>, `options?`: Pick&#60;[FactoryOptions](../interfaces/factoryoptions.md), &#34;merge&#34; \| &#34;convertCustomTypes&#34;>): T

*Defined in [packages/core/src/entity/EntityFactory.ts:63](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L63)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> | - |
`id` | [Primary](../index.md#primary)&#60;T> \| [Primary](../index.md#primary)&#60;T>[] \| Record&#60;string, [Primary](../index.md#primary)&#60;T>> | - |
`options` | Pick&#60;[FactoryOptions](../interfaces/factoryoptions.md), &#34;merge&#34; \| &#34;convertCustomTypes&#34;> | {} |

**Returns:** T

___

### denormalizePrimaryKey

▸ `Private`**denormalizePrimaryKey**&#60;T>(`data`: [EntityData](../index.md#entitydata)&#60;T>, `primaryKey`: string, `prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>): void

*Defined in [packages/core/src/entity/EntityFactory.ts:152](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L152)*

denormalize PK to value required by driver (e.g. ObjectId)

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`primaryKey` | string |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |

**Returns:** void

___

### extractConstructorParams

▸ `Private`**extractConstructorParams**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>): T[keyof T][]

*Defined in [packages/core/src/entity/EntityFactory.ts:170](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L170)*

returns parameters for entity constructor, creating references from plain ids

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** T[keyof T][]

___

### findEntity

▸ `Private`**findEntity**&#60;T>(`data`: [EntityData](../index.md#entitydata)&#60;T>, `meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `convertCustomTypes?`: boolean): T \| undefined

*Defined in [packages/core/src/entity/EntityFactory.ts:117](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L117)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`convertCustomTypes?` | boolean |

**Returns:** T \| undefined

___

### hydrate

▸ `Private`**hydrate**&#60;T>(`entity`: T, `meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `options`: [FactoryOptions](../interfaces/factoryoptions.md)): void

*Defined in [packages/core/src/entity/EntityFactory.ts:109](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L109)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`options` | [FactoryOptions](../interfaces/factoryoptions.md) |

**Returns:** void

___

### processDiscriminatorColumn

▸ `Private`**processDiscriminatorColumn**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>): [EntityMetadata](entitymetadata.md)&#60;T>

*Defined in [packages/core/src/entity/EntityFactory.ts:131](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityFactory.ts#L131)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** [EntityMetadata](entitymetadata.md)&#60;T>
