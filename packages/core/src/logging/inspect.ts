let nodeInspect: ((v: any, o?: any) => string) | undefined;

/** @internal */
export function inspect(value: unknown, options?: Record<string, any>): string {
  nodeInspect ??= globalThis.process?.getBuiltinModule?.('node:util').inspect;

  /* v8 ignore else */
  if (nodeInspect) {
    return nodeInspect(value, options);
  }

  /* v8 ignore next */
  return JSON.stringify(value, null, 2);
}
