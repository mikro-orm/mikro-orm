// Polyfill Symbol.metadata for runtimes that do not support it natively
// (e.g. current Node.js).
//
// TypeScript's ES-decorator output uses `Symbol.metadata` as the key to share
// one metadata object across all decorators in a class:
//
//   const _metadata = typeof Symbol === "function" && Symbol.metadata
//     ? Object.create(null)
//     : void 0;
//
// When the symbol is absent, the runtime sets `_metadata = void 0` and every
// decorator context receives `metadata: undefined`, making it impossible to
// propagate field-level metadata to the class decorator. Installing the symbol
// first ensures `_metadata` is always a proper object.
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
(Symbol as any).metadata ??= Symbol('Symbol.metadata');

export * from './PrimaryKey.js';
export * from './Entity.js';
export * from './OneToOne.js';
export * from './ManyToOne.js';
export * from './ManyToMany.js';
export * from './OneToMany.js';
export * from './Property.js';
export * from './Check.js';
export * from './Enum.js';
export * from './Formula.js';
export * from './Indexed.js';
export * from './Embeddable.js';
export * from './Embedded.js';
export * from './Filter.js';
export * from './CreateRequestContext.js';
export * from './hooks.js';
export * from './Transactional.js';
