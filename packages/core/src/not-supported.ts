export function discoverEntities() {
  throw new Error('Folder-based discovery is not supported in this environment.');
}

export const fs = new Proxy(
  {},
  {
    get: () => {
      throw new Error('File system is not supported in this environment.');
    },
  },
);
