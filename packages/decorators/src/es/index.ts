// Polyfill Symbol.metadata for runtimes that do not support it natively
// (e.g. current Node.js). Without it, TypeScript's ES-decorator output sets
// `_metadata = void 0` and decorator contexts receive `metadata: undefined`,
// making it impossible to propagate field-level metadata to the class decorator.
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
