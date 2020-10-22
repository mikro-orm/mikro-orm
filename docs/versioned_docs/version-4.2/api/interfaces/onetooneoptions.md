---
id: "onetooneoptions"
title: "Interface: OneToOneOptions<T, O>"
sidebar_label: "OneToOneOptions"
---

## Type parameters

Name |
------ |
`T` |
`O` |

## Hierarchy

* {}

  ↳ **OneToOneOptions**

## Properties

### inversedBy

• `Optional` **inversedBy**: string & keyof T \| (e: T) => any

*Defined in [packages/core/src/decorators/OneToOne.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/decorators/OneToOne.ts#L15)*

___

### mapToPk

• `Optional` **mapToPk**: boolean

*Defined in [packages/core/src/decorators/OneToOne.ts:18](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/decorators/OneToOne.ts#L18)*

___

### onDelete

• `Optional` **onDelete**: &#34;cascade&#34; \| &#34;no action&#34; \| &#34;set null&#34; \| &#34;set default&#34; \| string

*Defined in [packages/core/src/decorators/OneToOne.ts:19](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/decorators/OneToOne.ts#L19)*

___

### onUpdateIntegrity

• `Optional` **onUpdateIntegrity**: &#34;cascade&#34; \| &#34;no action&#34; \| &#34;set null&#34; \| &#34;set default&#34; \| string

*Defined in [packages/core/src/decorators/OneToOne.ts:20](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/decorators/OneToOne.ts#L20)*

___

### owner

• `Optional` **owner**: boolean

*Defined in [packages/core/src/decorators/OneToOne.ts:14](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/decorators/OneToOne.ts#L14)*

___

### primary

• `Optional` **primary**: boolean

*Defined in [packages/core/src/decorators/OneToOne.ts:17](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/decorators/OneToOne.ts#L17)*

___

### wrappedReference

• `Optional` **wrappedReference**: boolean

*Defined in [packages/core/src/decorators/OneToOne.ts:16](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/decorators/OneToOne.ts#L16)*
