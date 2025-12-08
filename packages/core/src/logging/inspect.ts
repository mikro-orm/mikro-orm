let nodeInspect: ((v: any, o?: any) => string) | undefined;

/** @internal */
export function inspect(value: unknown, options?: Record<string, any>): string {
  if (nodeInspect === undefined) {
    /* v8 ignore else */
    if (globalThis.process?.getBuiltinModule) {
      nodeInspect = globalThis.process.getBuiltinModule('node:util').inspect;
    }
  }

  /* v8 ignore else */
  if (nodeInspect) {
    return nodeInspect(value, options);
  }

  /* v8 ignore next */
  return JSON.stringify(value, null, 2);
}
