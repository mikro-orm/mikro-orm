---
id: "knex.tabledifference"
title: "Interface: TableDifference"
sidebar_label: "TableDifference"
hide_title: true
---

# Interface: TableDifference

[knex](../modules/knex.md).TableDifference

## Hierarchy

* **TableDifference**

## Properties

### addIndex

• **addIndex**: [*IndexDef*](knex.indexdef.md)[]

Defined in: [packages/knex/src/typings.ts:72](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/typings.ts#L72)

___

### create

• **create**: [*EntityProperty*](core.entityproperty.md)<*any*\>[]

Defined in: [packages/knex/src/typings.ts:68](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/typings.ts#L68)

___

### dropIndex

• **dropIndex**: [*IndexDef*](knex.indexdef.md)[]

Defined in: [packages/knex/src/typings.ts:73](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/typings.ts#L73)

___

### remove

• **remove**: [*Column*](knex.column.md)[]

Defined in: [packages/knex/src/typings.ts:71](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/typings.ts#L71)

___

### rename

• **rename**: { `from`: [*Column*](knex.column.md) ; `to`: [*EntityProperty*](core.entityproperty.md)<*any*\>  }[]

Defined in: [packages/knex/src/typings.ts:70](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/typings.ts#L70)

___

### update

• **update**: { `column`: [*Column*](knex.column.md) ; `diff`: [*IsSame*](knex.issame.md) ; `prop`: [*EntityProperty*](core.entityproperty.md)<*any*\>  }[]

Defined in: [packages/knex/src/typings.ts:69](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/knex/src/typings.ts#L69)
