---
id: "tabledifference"
title: "Interface: TableDifference"
sidebar_label: "TableDifference"
---

## Hierarchy

* **TableDifference**

## Properties

### addIndex

•  **addIndex**: [IndexDef](indexdef.md)[]

*Defined in [packages/knex/src/typings.ts:72](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/typings.ts#L72)*

___

### create

•  **create**: EntityProperty[]

*Defined in [packages/knex/src/typings.ts:68](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/typings.ts#L68)*

___

### dropIndex

•  **dropIndex**: [IndexDef](indexdef.md)[]

*Defined in [packages/knex/src/typings.ts:73](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/typings.ts#L73)*

___

### remove

•  **remove**: [Column](column.md)[]

*Defined in [packages/knex/src/typings.ts:71](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/typings.ts#L71)*

___

### rename

•  **rename**: { from: [Column](column.md) ; to: EntityProperty  }[]

*Defined in [packages/knex/src/typings.ts:70](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/typings.ts#L70)*

___

### update

•  **update**: { column: [Column](column.md) ; diff: [IsSame](issame.md) ; prop: EntityProperty  }[]

*Defined in [packages/knex/src/typings.ts:69](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/knex/src/typings.ts#L69)*
