export enum ReferenceType {
  SCALAR = 'scalar',
  MANY_TO_ONE = 'm:1',
  ONE_TO_MANY = '1:m',
  MANY_TO_MANY = 'm:n',
}

export enum Cascade {
  PERSIST = 'persist',
  REMOVE = 'remove',
}
