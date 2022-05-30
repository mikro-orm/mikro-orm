import type { Dictionary, EntityProperty } from '../typings';
import { ReferenceType } from '../enums';

export const enum NodeState {
  NOT_VISITED = 0,
  IN_PROGRESS = 1,
  VISITED = 2,
}

export interface Node {
  hash: string;
  state: NodeState;
  dependencies: Dictionary<Edge>;
}

export interface Edge {
  from: string;
  to: string;
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
  private nodes: Dictionary<Node> = {};

  /** Volatile variable holding calculated nodes during sorting process. */
  private sortedNodeList: string[] = [];

  /**
   * Checks for node existence in graph.
   */
  hasNode(hash: string): boolean {
    return hash in this.nodes;
  }

  /**
   * Adds a new node to the graph, assigning its hash.
   */
  addNode(hash: string): void {
    this.nodes[hash] = { hash, state: NodeState.NOT_VISITED, dependencies: {} };
  }

  /**
   * Adds a new dependency (edge) to the graph using their hashes.
   */
  addDependency(from: string, to: string, weight: number): void {
    this.nodes[from].dependencies[to] = { from, to, weight };
  }

  discoverProperty(prop: EntityProperty, entityName: string): void {
    const toOneOwner = (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner) || prop.reference === ReferenceType.MANY_TO_ONE;
    const toManyOwner = prop.reference === ReferenceType.MANY_TO_MANY && prop.owner && !prop.pivotEntity;

    if (!toOneOwner && !toManyOwner) {
      return;
    }

    const propertyType = prop.targetMeta?.root.className;

    if (!propertyType || !this.hasNode(propertyType)) {
      return;
    }

    this.addDependency(propertyType, entityName, prop.nullable ? 0 : 1);
  }

  /**
   * Return a valid order list of all current nodes.
   * The desired topological sorting is the reverse post order of these searches.
   *
   * @internal Highly performance-sensitive method.
   */
  sort(): string[] {
    for (const vertex of Object.values(this.nodes)) {
      if (vertex.state !== NodeState.NOT_VISITED) {
        continue;
      }

      this.visit(vertex);
    }

    const sortedList = this.sortedNodeList.reverse();
    this.nodes = {};
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

    for (const edge of Object.values(node.dependencies)) {
      const target = this.nodes[edge.to];

      switch (target.state) {
        case NodeState.VISITED: break; // Do nothing, since node was already visited
        case NodeState.IN_PROGRESS: this.visitOpenNode(node, target, edge); break;
        case NodeState.NOT_VISITED: this.visit(target);
      }
    }

    if (node.state as unknown !== NodeState.VISITED) {
      node.state = NodeState.VISITED;
      this.sortedNodeList.push(node.hash);
    }
  }

  /**
   * Visits all target's dependencies if in cycle with given node
   */
  private visitOpenNode(node: Node, target: Node, edge: Edge): void {
    if (!target.dependencies[node.hash] || target.dependencies[node.hash].weight >= edge.weight) {
      return;
    }

    for (const edge of Object.values(target.dependencies)) {
      const targetNode = this.nodes[edge.to];

      if (targetNode.state === NodeState.NOT_VISITED) {
        this.visit(targetNode);
      }
    }

    target.state = NodeState.VISITED;
    this.sortedNodeList.push(target.hash);
  }

}
