---
id: "commitordercalculator"
title: "Class: CommitOrderCalculator"
sidebar_label: "CommitOrderCalculator"
---

CommitOrderCalculator implements topological sorting, which is an ordering
algorithm for directed graphs (DG) and/or directed acyclic graphs (DAG) by
using a depth-first searching (DFS) to traverse the graph built in memory.
This algorithm have a linear running time based on nodes (V) and dependency
between the nodes (E), resulting in a computational complexity of O(V + E).

Based on https://github.com/doctrine/orm/blob/master/lib/Doctrine/ORM/Internal/CommitOrderCalculator.php

## Hierarchy

* **CommitOrderCalculator**

## Properties

### nodes

• `Private` **nodes**: [Dictionary](../index.md#dictionary)&#60;[Node](../interfaces/node.md)>

*Defined in [packages/core/src/unit-of-work/CommitOrderCalculator.ts:34](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L34)*

Matrix of nodes, keys are provided hashes and values are the node definition objects.

___

### sortedNodeList

• `Private` **sortedNodeList**: string[] = []

*Defined in [packages/core/src/unit-of-work/CommitOrderCalculator.ts:37](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L37)*

Volatile variable holding calculated nodes during sorting process.

## Methods

### addDependency

▸ **addDependency**(`from`: string, `to`: string, `weight`: number): void

*Defined in [packages/core/src/unit-of-work/CommitOrderCalculator.ts:56](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L56)*

Adds a new dependency (edge) to the graph using their hashes.

#### Parameters:

Name | Type |
------ | ------ |
`from` | string |
`to` | string |
`weight` | number |

**Returns:** void

___

### addNode

▸ **addNode**(`hash`: string): void

*Defined in [packages/core/src/unit-of-work/CommitOrderCalculator.ts:49](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L49)*

Adds a new node to the graph, assigning its hash.

#### Parameters:

Name | Type |
------ | ------ |
`hash` | string |

**Returns:** void

___

### discoverProperty

▸ **discoverProperty**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `entityName`: string): void

*Defined in [packages/core/src/unit-of-work/CommitOrderCalculator.ts:60](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L60)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`entityName` | string |

**Returns:** void

___

### hasNode

▸ **hasNode**(`hash`: string): boolean

*Defined in [packages/core/src/unit-of-work/CommitOrderCalculator.ts:42](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L42)*

Checks for node existence in graph.

#### Parameters:

Name | Type |
------ | ------ |
`hash` | string |

**Returns:** boolean

___

### sort

▸ **sort**(): string[]

*Defined in [packages/core/src/unit-of-work/CommitOrderCalculator.ts:81](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L81)*

Return a valid order list of all current nodes.
The desired topological sorting is the reverse post order of these searches.

**`internal`** Highly performance-sensitive method.

**Returns:** string[]

___

### visit

▸ `Private`**visit**(`node`: [Node](../interfaces/node.md)): void

*Defined in [packages/core/src/unit-of-work/CommitOrderCalculator.ts:102](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L102)*

Visit a given node definition for reordering.

**`internal`** Highly performance-sensitive method.

#### Parameters:

Name | Type |
------ | ------ |
`node` | [Node](../interfaces/node.md) |

**Returns:** void

___

### visitOpenNode

▸ `Private`**visitOpenNode**(`node`: [Node](../interfaces/node.md), `target`: [Node](../interfaces/node.md), `edge`: [Edge](../interfaces/edge.md)): void

*Defined in [packages/core/src/unit-of-work/CommitOrderCalculator.ts:124](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L124)*

Visits all target's dependencies if in cycle with given node

#### Parameters:

Name | Type |
------ | ------ |
`node` | [Node](../interfaces/node.md) |
`target` | [Node](../interfaces/node.md) |
`edge` | [Edge](../interfaces/edge.md) |

**Returns:** void
