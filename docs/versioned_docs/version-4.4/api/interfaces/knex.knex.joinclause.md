---
id: "knex.knex.joinclause"
title: "Interface: JoinClause"
sidebar_label: "JoinClause"
hide_title: true
---

# Interface: JoinClause

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).JoinClause

## Hierarchy

* **JoinClause**

## Methods

### andOn

▸ **andOn**(`raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1129

▸ **andOn**(`callback`: [*JoinCallback*](knex.knex.joincallback.md)): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*JoinCallback*](knex.knex.joincallback.md) |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1130

▸ **andOn**(`columns`: { [key: string]: *string* \| [*Raw*](knex.knex.raw.md);  }): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`columns` | { [key: string]: *string* \| [*Raw*](knex.knex.raw.md);  } |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1131

▸ **andOn**(`column1`: *string*, `column2`: *string*): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`column2` | *string* |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1132

▸ **andOn**(`column1`: *string*, `raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1133

▸ **andOn**(`column1`: *string*, `operator`: *string*, `column2`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`operator` | *string* |
`column2` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1134

___

### andOnBetween

▸ **andOnBetween**(`column1`: *string*, `range`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`range` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1160

___

### andOnExists

▸ **andOnExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1154

___

### andOnIn

▸ **andOnIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1142

___

### andOnNotBetween

▸ **andOnNotBetween**(`column1`: *string*, `range`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`range` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1163

___

### andOnNotExists

▸ **andOnNotExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1157

___

### andOnNotIn

▸ **andOnNotIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1145

___

### andOnNotNull

▸ **andOnNotNull**(`column1`: *string*): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1151

___

### andOnNull

▸ **andOnNull**(`column1`: *string*): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1148

___

### on

▸ **on**(`raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1123

▸ **on**(`callback`: [*JoinCallback*](knex.knex.joincallback.md)): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*JoinCallback*](knex.knex.joincallback.md) |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1124

▸ **on**(`columns`: { [key: string]: *string* \| [*Raw*](knex.knex.raw.md);  }): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`columns` | { [key: string]: *string* \| [*Raw*](knex.knex.raw.md);  } |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1125

▸ **on**(`column1`: *string*, `column2`: *string*): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`column2` | *string* |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1126

▸ **on**(`column1`: *string*, `raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1127

▸ **on**(`column1`: *string*, `operator`: *string*, `column2`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`operator` | *string* |
`column2` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1128

___

### onBetween

▸ **onBetween**(`column1`: *string*, `range`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`range` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1159

___

### onExists

▸ **onExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1153

___

### onIn

▸ **onIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1141

___

### onNotBetween

▸ **onNotBetween**(`column1`: *string*, `range`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`range` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1162

___

### onNotExists

▸ **onNotExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1156

___

### onNotIn

▸ **onNotIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1144

___

### onNotNull

▸ **onNotNull**(`column1`: *string*): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1150

___

### onNull

▸ **onNull**(`column1`: *string*): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1147

___

### orOn

▸ **orOn**(`raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1135

▸ **orOn**(`callback`: [*JoinCallback*](knex.knex.joincallback.md)): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*JoinCallback*](knex.knex.joincallback.md) |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1136

▸ **orOn**(`columns`: { [key: string]: *string* \| [*Raw*](knex.knex.raw.md);  }): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`columns` | { [key: string]: *string* \| [*Raw*](knex.knex.raw.md);  } |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1137

▸ **orOn**(`column1`: *string*, `column2`: *string*): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`column2` | *string* |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1138

▸ **orOn**(`column1`: *string*, `raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1139

▸ **orOn**(`column1`: *string*, `operator`: *string*, `column2`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`operator` | *string* |
`column2` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1140

___

### orOnBetween

▸ **orOnBetween**(`column1`: *string*, `range`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`range` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1161

___

### orOnExists

▸ **orOnExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1155

___

### orOnIn

▸ **orOnIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1143

___

### orOnNotBetween

▸ **orOnNotBetween**(`column1`: *string*, `range`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`range` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1164

___

### orOnNotExists

▸ **orOnNotExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1158

___

### orOnNotIn

▸ **orOnNotIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1146

___

### orOnNotNull

▸ **orOnNotNull**(`column1`: *string*): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1152

___

### orOnNull

▸ **orOnNull**(`column1`: *string*): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1149

___

### type

▸ **type**(`type`: *string*): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`type` | *string* |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1168

___

### using

▸ **using**(`column`: *string* \| readonly *string*[] \| [*Raw*](knex.knex.raw.md)<*any*\> \| { [key: string]: *string* \| [*Raw*](knex.knex.raw.md);  }): [*JoinClause*](knex.knex.joinclause.md)

#### Parameters:

Name | Type |
------ | ------ |
`column` | *string* \| readonly *string*[] \| [*Raw*](knex.knex.raw.md)<*any*\> \| { [key: string]: *string* \| [*Raw*](knex.knex.raw.md);  } |

**Returns:** [*JoinClause*](knex.knex.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1165
