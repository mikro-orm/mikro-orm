---
id: "knex.knex-1.joinclause"
title: "Interface: JoinClause"
sidebar_label: "JoinClause"
custom_edit_url: null
hide_title: true
---

# Interface: JoinClause

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).JoinClause

## Methods

### andOn

▸ **andOn**(`raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1135

▸ **andOn**(`callback`: [*JoinCallback*](knex.knex-1.joincallback.md)): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*JoinCallback*](knex.knex-1.joincallback.md) |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1136

▸ **andOn**(`columns`: { [key: string]: *string* \| [*Raw*](knex.knex-1.raw.md);  }): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columns` | *object* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1137

▸ **andOn**(`column1`: *string*, `column2`: *string*): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`column2` | *string* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1138

▸ **andOn**(`column1`: *string*, `raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1139

▸ **andOn**(`column1`: *string*, `operator`: *string*, `column2`: *string* \| [*Raw*](knex.knex-1.raw.md)<any\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`operator` | *string* |
`column2` | *string* \| [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1140

___

### andOnBetween

▸ **andOnBetween**(`column1`: *string*, `range`: readonly [*any*, *any*]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`range` | readonly [*any*, *any*] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1166

___

### andOnExists

▸ **andOnExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1160

___

### andOnIn

▸ **andOnIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1148

___

### andOnNotBetween

▸ **andOnNotBetween**(`column1`: *string*, `range`: readonly [*any*, *any*]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`range` | readonly [*any*, *any*] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1169

___

### andOnNotExists

▸ **andOnNotExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1163

___

### andOnNotIn

▸ **andOnNotIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1151

___

### andOnNotNull

▸ **andOnNotNull**(`column1`: *string*): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1157

___

### andOnNull

▸ **andOnNull**(`column1`: *string*): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1154

___

### on

▸ **on**(`raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1129

▸ **on**(`callback`: [*JoinCallback*](knex.knex-1.joincallback.md)): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*JoinCallback*](knex.knex-1.joincallback.md) |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1130

▸ **on**(`columns`: { [key: string]: *string* \| [*Raw*](knex.knex-1.raw.md);  }): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columns` | *object* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1131

▸ **on**(`column1`: *string*, `column2`: *string*): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`column2` | *string* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1132

▸ **on**(`column1`: *string*, `raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1133

▸ **on**(`column1`: *string*, `operator`: *string*, `column2`: *string* \| [*Raw*](knex.knex-1.raw.md)<any\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`operator` | *string* |
`column2` | *string* \| [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1134

___

### onBetween

▸ **onBetween**(`column1`: *string*, `range`: readonly [*any*, *any*]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`range` | readonly [*any*, *any*] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1165

___

### onExists

▸ **onExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1159

___

### onIn

▸ **onIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1147

___

### onNotBetween

▸ **onNotBetween**(`column1`: *string*, `range`: readonly [*any*, *any*]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`range` | readonly [*any*, *any*] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1168

___

### onNotExists

▸ **onNotExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1162

___

### onNotIn

▸ **onNotIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1150

___

### onNotNull

▸ **onNotNull**(`column1`: *string*): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1156

___

### onNull

▸ **onNull**(`column1`: *string*): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1153

___

### orOn

▸ **orOn**(`raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1141

▸ **orOn**(`callback`: [*JoinCallback*](knex.knex-1.joincallback.md)): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*JoinCallback*](knex.knex-1.joincallback.md) |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1142

▸ **orOn**(`columns`: { [key: string]: *string* \| [*Raw*](knex.knex-1.raw.md);  }): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columns` | *object* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1143

▸ **orOn**(`column1`: *string*, `column2`: *string*): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`column2` | *string* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1144

▸ **orOn**(`column1`: *string*, `raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1145

▸ **orOn**(`column1`: *string*, `operator`: *string*, `column2`: *string* \| [*Raw*](knex.knex-1.raw.md)<any\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`operator` | *string* |
`column2` | *string* \| [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1146

___

### orOnBetween

▸ **orOnBetween**(`column1`: *string*, `range`: readonly [*any*, *any*]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`range` | readonly [*any*, *any*] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1167

___

### orOnExists

▸ **orOnExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1161

___

### orOnIn

▸ **orOnIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1149

___

### orOnNotBetween

▸ **orOnNotBetween**(`column1`: *string*, `range`: readonly [*any*, *any*]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`range` | readonly [*any*, *any*] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1170

___

### orOnNotExists

▸ **orOnNotExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1164

___

### orOnNotIn

▸ **orOnNotIn**(`column1`: *string*, `values`: readonly *any*[]): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |
`values` | readonly *any*[] |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1152

___

### orOnNotNull

▸ **orOnNotNull**(`column1`: *string*): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1158

___

### orOnNull

▸ **orOnNull**(`column1`: *string*): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column1` | *string* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1155

___

### type

▸ **type**(`type`: *string*): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`type` | *string* |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1174

___

### using

▸ **using**(`column`: *string* \| readonly *string*[] \| [*Raw*](knex.knex-1.raw.md)<any\> \| { [key: string]: *string* \| [*Raw*](knex.knex-1.raw.md);  }): [*JoinClause*](knex.knex-1.joinclause.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *string* \| readonly *string*[] \| [*Raw*](knex.knex-1.raw.md)<any\> \| { [key: string]: *string* \| [*Raw*](knex.knex-1.raw.md);  } |

**Returns:** [*JoinClause*](knex.knex-1.joinclause.md)

Defined in: node_modules/knex/types/index.d.ts:1171
