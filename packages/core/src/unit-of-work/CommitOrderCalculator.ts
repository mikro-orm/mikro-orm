import type { EntityProperty } from '../typings.js';
import { ReferenceKind } from '../enums.js';

export const enum NodeState {
  NOT_VISITED = 0,
  IN_PROGRESS = 1,
  VISITED = 2,
}

type Hash = number;

export interface Node {
  hash: Hash;
  state: NodeState;
  dependencies: Map<Hash, Edge>;
}

export interface Edge {
  from: Hash;
  to: Hash;
  weight: number;
}

/**
 * CommitOrderCalculator implements topological sorting, which is an ordering
 * algorithm for directed graphs (DG) and/or directed acyclic graphs (DAG) by
 * using a depth-first searching (DFS) to traverse the graph built in memory.
 * This algorithm have a linear running time based on nodes (V) and dependency
 * between the nodes (E), resulting in a computational complexity of O(V + E).
 *
 * Based on https://github.com/doctrine/orm/blob/master/lib/Doctrine/ORM/Internal/CommitOrderCalculator.php
 * @internal
 */
export class CommitOrderCalculator {
  /** Matrix of nodes, keys are provided hashes and values are the node definition objects. */
  private nodes = new Map<Hash, Node>();

  /** Volatile variable holding calculated nodes during sorting process. */
  private sortedNodeList: Hash[] = [];

  /**
   * Checks for node existence in graph.
   */
  hasNode(hash: Hash): boolean {
    return this.nodes.has(hash);
  }

  /**
   * Adds a new node to the graph, assigning its hash.
   */
  addNode(hash: Hash): void {
    this.nodes.set(hash, { hash, state: NodeState.NOT_VISITED, dependencies: new Map() });
  }

  /**
   * Adds a new dependency (edge) to the graph using their hashes.
   */
  addDependency(from: Hash, to: Hash, weight: number): void {
    this.nodes.get(from)!.dependencies.set(to, { from, to, weight });
  }

  discoverProperty(prop: EntityProperty, entityName: Hash): void {
    const toOneOwner =
      (prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner) || prop.kind === ReferenceKind.MANY_TO_ONE;
    const toManyOwner = prop.kind === ReferenceKind.MANY_TO_MANY && prop.owner && !prop.pivotEntity;

    if (!toOneOwner && !toManyOwner) {
      return;
    }

    const propertyType = prop.targetMeta?.root._id;

    if (propertyType == null || !this.hasNode(propertyType)) {
      return;
    }

    this.addDependency(propertyType, entityName, prop.nullable || prop.persist === false ? 0 : 1);
  }

  /**
   * Return a valid order list of all current nodes.
   * The desired topological sorting is the reverse post order of these searches.
   *
   * @internal Highly performance-sensitive method.
   */
  sort(): Hash[] {
    for (const vertex of this.nodes.values()) {
      if (vertex.state !== NodeState.NOT_VISITED) {
        continue;
      }

      this.visit(vertex);
    }

    const sortedList = this.sortedNodeList.reverse();
    this.nodes = new Map();
    this.sortedNodeList = [];

    return sortedList;
  }

  /**
   * Visit a given node definition for reordering.
   *
   * @internal Highly performance-sensitive method.
   */
  private visit(node: Node): void {
    node.state = NodeState.IN_PROGRESS;

    for (const edge of node.dependencies.values()) {
      const target = this.nodes.get(edge.to)!;

      switch (target.state) {
        case NodeState.VISITED:
          break; // Do nothing, since node was already visited
        case NodeState.IN_PROGRESS:
          this.visitOpenNode(node, target, edge);
          break;
        case NodeState.NOT_VISITED:
          this.visit(target);
      }
    }

    if ((node.state as unknown) !== NodeState.VISITED) {
      node.state = NodeState.VISITED;
      this.sortedNodeList.push(node.hash);
    }
  }

  /**
   * Visits all target's dependencies if in cycle with given node
   */
  private visitOpenNode(node: Node, target: Node, edge: Edge): void {
    if (!target.dependencies.has(node.hash) || target.dependencies.get(node.hash)!.weight >= edge.weight) {
      return;
    }

    for (const edge of target.dependencies.values()) {
      const targetNode = this.nodes.get(edge.to)!;

      if (targetNode.state === NodeState.NOT_VISITED) {
        this.visit(targetNode);
      }
    }

    target.state = NodeState.VISITED;
    this.sortedNodeList.push(target.hash);
  }
}
