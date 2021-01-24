---
id: "core.commitordercalculator"
title: "Class: CommitOrderCalculator"
sidebar_label: "CommitOrderCalculator"
hide_title: true
---

# Class: CommitOrderCalculator

[core](../modules/core.md).CommitOrderCalculator

CommitOrderCalculator implements topological sorting, which is an ordering
algorithm for directed graphs (DG) and/or directed acyclic graphs (DAG) by
using a depth-first searching (DFS) to traverse the graph built in memory.
This algorithm have a linear running time based on nodes (V) and dependency
between the nodes (E), resulting in a computational complexity of O(V + E).

Based on https://github.com/doctrine/orm/blob/master/lib/Doctrine/ORM/Internal/CommitOrderCalculator.php

## Hierarchy

* **CommitOrderCalculator**

## Constructors

### constructor

\+ **new CommitOrderCalculator**(): [*CommitOrderCalculator*](core.commitordercalculator.md)

**Returns:** [*CommitOrderCalculator*](core.commitordercalculator.md)

## Properties

### nodes

• `Private` **nodes**: [*Dictionary*](../modules/core.md#dictionary)<[*Node*](../interfaces/core.node.md)\>

Matrix of nodes, keys are provided hashes and values are the node definition objects.

Defined in: [packages/core/src/unit-of-work/CommitOrderCalculator.ts:34](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L34)

___

### sortedNodeList

• `Private` **sortedNodeList**: *string*[]

Volatile variable holding calculated nodes during sorting process.

Defined in: [packages/core/src/unit-of-work/CommitOrderCalculator.ts:37](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L37)

## Methods

### addDependency

▸ **addDependency**(`from`: *string*, `to`: *string*, `weight`: *number*): *void*

Adds a new dependency (edge) to the graph using their hashes.

#### Parameters:

Name | Type |
------ | ------ |
`from` | *string* |
`to` | *string* |
`weight` | *number* |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/CommitOrderCalculator.ts:56](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L56)

___

### addNode

▸ **addNode**(`hash`: *string*): *void*

Adds a new node to the graph, assigning its hash.

#### Parameters:

Name | Type |
------ | ------ |
`hash` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/CommitOrderCalculator.ts:49](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L49)

___

### discoverProperty

▸ **discoverProperty**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `entityName`: *string*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`entityName` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/CommitOrderCalculator.ts:60](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L60)

___

### hasNode

▸ **hasNode**(`hash`: *string*): *boolean*

Checks for node existence in graph.

#### Parameters:

Name | Type |
------ | ------ |
`hash` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/unit-of-work/CommitOrderCalculator.ts:42](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L42)

___

### sort

▸ **sort**(): *string*[]

Return a valid order list of all current nodes.
The desired topological sorting is the reverse post order of these searches.

**`internal`** Highly performance-sensitive method.

**Returns:** *string*[]

Defined in: [packages/core/src/unit-of-work/CommitOrderCalculator.ts:81](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L81)

___

### visit

▸ `Private`**visit**(`node`: [*Node*](../interfaces/core.node.md)): *void*

Visit a given node definition for reordering.

**`internal`** Highly performance-sensitive method.

#### Parameters:

Name | Type |
------ | ------ |
`node` | [*Node*](../interfaces/core.node.md) |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/CommitOrderCalculator.ts:102](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L102)

___

### visitOpenNode

▸ `Private`**visitOpenNode**(`node`: [*Node*](../interfaces/core.node.md), `target`: [*Node*](../interfaces/core.node.md), `edge`: [*Edge*](../interfaces/core.edge.md)): *void*

Visits all target's dependencies if in cycle with given node

#### Parameters:

Name | Type |
------ | ------ |
`node` | [*Node*](../interfaces/core.node.md) |
`target` | [*Node*](../interfaces/core.node.md) |
`edge` | [*Edge*](../interfaces/core.edge.md) |

**Returns:** *void*

Defined in: [packages/core/src/unit-of-work/CommitOrderCalculator.ts:124](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/unit-of-work/CommitOrderCalculator.ts#L124)
