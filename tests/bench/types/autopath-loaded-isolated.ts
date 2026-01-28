#!/usr/bin/env -S node --import=tsx

/**
 * Isolated benchmarks to identify bottlenecks in AutoPath and Loaded types.
 * These tests use simple, linear entity structures without circular references
 * to measure the true cost of the type computations.
 *
 * These tests helped identify a major performance issue: using `extends Collection<any, any>`
 * in conditional types caused massive instantiation explosion (~133k instantiations).
 * The fix was to use property-based checks instead: `extends { [k: number]: any; readonly owner: object }`.
 */

import { bench } from '@ark/attest';
import {
  type AutoPath,
  type Loaded,
  type Ref,
  type Collection,
  type PopulatePath,
  PrimaryKeyProp,
} from '@mikro-orm/core';

// ============================================
// LINEAR entity chain (no circular refs)
// ============================================

interface Country {
  id: number;
  name: string;
  [PrimaryKeyProp]?: 'id';
}

interface City {
  id: number;
  name: string;
  country: Ref<Country>;
  [PrimaryKeyProp]?: 'id';
}

interface Address {
  id: number;
  street: string;
  city: Ref<City>;
  [PrimaryKeyProp]?: 'id';
}

interface Person {
  id: number;
  name: string;
  address: Ref<Address>;
  [PrimaryKeyProp]?: 'id';
}

// ============================================
// AutoPath with LINEAR entities
// ============================================

// eslint-disable-next-line
function validatePath<T, P extends string>(_path: AutoPath<T, P, PopulatePath.ALL>): void {}

bench('AutoPath LINEAR - 1 level', () => {
  validatePath<Person, 'address'>('address');
}).types([2100, 'instantiations']);

bench('AutoPath LINEAR - 2 levels', () => {
  validatePath<Person, 'address.city'>('address.city');
}).types([2400, 'instantiations']);

bench('AutoPath LINEAR - 3 levels', () => {
  validatePath<Person, 'address.city.country'>('address.city.country');
}).types([2700, 'instantiations']);

// ============================================
// Loaded with LINEAR entities (Ref only)
// ============================================

// eslint-disable-next-line
function useLoaded<T, L extends string = never>(_entity: Loaded<T, L>): void {}

bench('Loaded LINEAR - no populate', () => {
  useLoaded<Person>({} as Person);
}).types([600, 'instantiations']);

bench('Loaded LINEAR - 1 level (Ref)', () => {
  useLoaded<Person, 'address'>({} as Loaded<Person, 'address'>);
}).types([1600, 'instantiations']);

bench('Loaded LINEAR - 2 levels (Ref)', () => {
  useLoaded<Person, 'address.city'>({} as Loaded<Person, 'address.city'>);
}).types([1600, 'instantiations']);

bench('Loaded LINEAR - 3 levels (Ref)', () => {
  useLoaded<Person, 'address.city.country'>({} as Loaded<Person, 'address.city.country'>);
}).types([1600, 'instantiations']);

// ============================================
// SELF-REFERENCING entity (single type circular)
// ============================================

interface TreeNode {
  id: number;
  name: string;
  parent?: Ref<TreeNode> | null;
  children: Collection<TreeNode>;
  [PrimaryKeyProp]?: 'id';
}

bench('AutoPath SELF-REF - 1 level', () => {
  validatePath<TreeNode, 'parent'>('parent');
}).types([2200, 'instantiations']);

bench('AutoPath SELF-REF - 2 levels', () => {
  validatePath<TreeNode, 'parent.parent'>('parent.parent');
}).types([2300, 'instantiations']);

bench('AutoPath SELF-REF - children (Collection)', () => {
  validatePath<TreeNode, 'children'>('children');
}).types([1800, 'instantiations']);

bench('Loaded SELF-REF - 1 level (Ref)', () => {
  useLoaded<TreeNode, 'parent'>({} as Loaded<TreeNode, 'parent'>);
}).types([1600, 'instantiations']);

bench('Loaded SELF-REF - 2 levels (Ref)', () => {
  useLoaded<TreeNode, 'parent.parent'>({} as Loaded<TreeNode, 'parent.parent'>);
}).types([1600, 'instantiations']);

bench('Loaded SELF-REF - children (Collection)', () => {
  useLoaded<TreeNode, 'children'>({} as Loaded<TreeNode, 'children'>);
}).types([1000, 'instantiations']);

// ============================================
// TWO-WAY circular reference (A <-> B)
// ============================================

interface Employee {
  id: number;
  name: string;
  department: Ref<Department>;
  [PrimaryKeyProp]?: 'id';
}

interface Department {
  id: number;
  name: string;
  employees: Collection<Employee>;
  manager: Ref<Employee>;
  [PrimaryKeyProp]?: 'id';
}

bench('AutoPath CIRCULAR - simple', () => {
  validatePath<Employee, 'department'>('department');
}).types([2100, 'instantiations']);

bench('AutoPath CIRCULAR - 2 levels', () => {
  validatePath<Employee, 'department.manager'>('department.manager');
}).types([2400, 'instantiations']);

bench('AutoPath CIRCULAR - 3 levels', () => {
  validatePath<Employee, 'department.manager.department'>('department.manager.department');
}).types([2500, 'instantiations']);

bench('Loaded CIRCULAR - simple (Ref)', () => {
  useLoaded<Employee, 'department'>({} as Loaded<Employee, 'department'>);
}).types([1600, 'instantiations']);

bench('Loaded CIRCULAR - 2 levels (Ref)', () => {
  useLoaded<Employee, 'department.manager'>({} as Loaded<Employee, 'department.manager'>);
}).types([1600, 'instantiations']);

bench('Loaded CIRCULAR - back to start (Ref)', () => {
  useLoaded<Employee, 'department.manager.department'>({} as Loaded<Employee, 'department.manager.department'>);
}).types([1600, 'instantiations']);

bench('Loaded CIRCULAR - collection', () => {
  useLoaded<Department, 'employees'>({} as Loaded<Department, 'employees'>);
}).types([1000, 'instantiations']);

bench('Loaded CIRCULAR - collection nested', () => {
  useLoaded<Department, 'employees.department'>({} as Loaded<Department, 'employees.department'>);
}).types([1000, 'instantiations']);

// ============================================
// Entity with many properties (width test)
// ============================================

interface WideSimple {
  id: number;
  f1: string; f2: string; f3: string; f4: string; f5: string;
  f6: string; f7: string; f8: string; f9: string; f10: string;
  f11: string; f12: string; f13: string; f14: string; f15: string;
  f16: string; f17: string; f18: string; f19: string; f20: string;
  [PrimaryKeyProp]?: 'id';
}

interface WideWithRefs {
  id: number;
  f1: string; f2: string; f3: string; f4: string; f5: string;
  r1: Ref<Country>;
  r2: Ref<Country>;
  r3: Ref<Country>;
  r4: Ref<Country>;
  r5: Ref<Country>;
  [PrimaryKeyProp]?: 'id';
}

bench('AutoPath WIDE - 20 scalar props', () => {
  validatePath<WideSimple, 'f1'>('f1');
}).types([2000, 'instantiations']);

bench('AutoPath WIDE - 5 refs', () => {
  validatePath<WideWithRefs, 'r1'>('r1');
}).types([2200, 'instantiations']);

bench('Loaded WIDE - 20 scalar props', () => {
  useLoaded<WideSimple>({} as WideSimple);
}).types([1000, 'instantiations']);

bench('Loaded WIDE - 5 refs no populate', () => {
  useLoaded<WideWithRefs>({} as WideWithRefs);
}).types([800, 'instantiations']);

bench('Loaded WIDE - 5 refs all populated', () => {
  useLoaded<WideWithRefs, 'r1' | 'r2' | 'r3' | 'r4' | 'r5'>({} as Loaded<WideWithRefs, 'r1' | 'r2' | 'r3' | 'r4' | 'r5'>);
}).types([2300, 'instantiations']);
