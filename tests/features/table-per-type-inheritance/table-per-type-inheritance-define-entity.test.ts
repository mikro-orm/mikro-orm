/**
 * TPT (Table-Per-Type) Inheritance tests using defineEntity
 */

import { defineEntity, LoadStrategy, MikroORM, p } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

// ============================================================
// Basic TPT hierarchy without relations
// ============================================================

// Base vehicle entity with TPT inheritance
const VehicleDef = defineEntity({
  name: 'VehicleDef',
  abstract: true,
  inheritance: 'tpt',
  properties: {
    id: p.integer().primary(),
    brand: p.string(),
    model: p.string(),
  },
});

// Car extends Vehicle
const CarDef = defineEntity({
  name: 'CarDef',
  extends: VehicleDef,
  properties: {
    numDoors: p.integer(),
  },
});

// Motorcycle extends Vehicle
const MotorcycleDef = defineEntity({
  name: 'MotorcycleDef',
  extends: VehicleDef,
  properties: {
    engineCC: p.integer(),
  },
});

// ============================================================
// TPT hierarchy with relations
// ============================================================

// Base vehicle with owner relation - must come first so Owner can reference it
const OwnedVehicleDef = defineEntity({
  name: 'OwnedVehicleDef',
  abstract: true,
  inheritance: 'tpt',
  properties: {
    id: p.integer().primary(),
    brand: p.string(),
    owner: () => p.manyToOne(OwnerDef).ref().nullable(),
  },
});

// Owner that can own vehicles (relation to abstract base)
const OwnerDef = defineEntity({
  name: 'OwnerDef',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    vehicles: () => p.oneToMany(OwnedVehicleDef).mappedBy('owner'),
  },
});

// Owned car
const OwnedCarDef = defineEntity({
  name: 'OwnedCarDef',
  extends: OwnedVehicleDef,
  properties: {
    numDoors: p.integer(),
  },
});

// Owned motorcycle
const OwnedMotorcycleDef = defineEntity({
  name: 'OwnedMotorcycleDef',
  extends: OwnedVehicleDef,
  properties: {
    engineCC: p.integer(),
  },
});

// ============================================================
// Multi-level TPT hierarchy
// ============================================================

const AnimalDef = defineEntity({
  name: 'AnimalDef',
  abstract: true,
  inheritance: 'tpt',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const MammalDef = defineEntity({
  name: 'MammalDef',
  abstract: true,
  extends: AnimalDef,
  properties: {
    warmBlooded: p.boolean().default(true),
  },
});

const DogDef = defineEntity({
  name: 'DogDef',
  extends: MammalDef,
  properties: {
    breed: p.string(),
  },
});

const CatDef = defineEntity({
  name: 'CatDef',
  extends: MammalDef,
  properties: {
    indoor: p.boolean(),
  },
});

// ============================================================
// Tests
// ============================================================

describe('TPT with defineEntity', () => {

  describe('basic TPT operations', () => {

    test('basic TPT operations without relations to abstract', async () => {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        entities: [VehicleDef, CarDef, MotorcycleDef],
      });

      await orm.schema.create();

      // Create entities
      const car = orm.em.create(CarDef, { brand: 'Toyota', model: 'Camry', numDoors: 4 });
      const motorcycle = orm.em.create(MotorcycleDef, { brand: 'Honda', model: 'CBR', engineCC: 600 });
      await orm.em.flush();
      orm.em.clear();

      // Load them back
      const loadedCar = await orm.em.findOneOrFail(CarDef, car.id);
      expect(loadedCar.brand).toBe('Toyota');
      expect(loadedCar.numDoors).toBe(4);

      const loadedMotorcycle = await orm.em.findOneOrFail(MotorcycleDef, motorcycle.id);
      expect(loadedMotorcycle.brand).toBe('Honda');
      expect(loadedMotorcycle.engineCC).toBe(600);

      // Polymorphic query
      const vehicles = await orm.em.find(VehicleDef, {}, { orderBy: { brand: 'ASC' } });
      expect(vehicles).toHaveLength(2);
      expect(vehicles[0].brand).toBe('Honda');
      expect('engineCC' in vehicles[0]).toBe(true);
      expect(vehicles[1].brand).toBe('Toyota');
      expect('numDoors' in vehicles[1]).toBe(true);

      await orm.close();
    });

    test('update and delete operations', async () => {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        entities: [VehicleDef, CarDef, MotorcycleDef],
      });

      await orm.schema.create();

      // Create and update
      const car = orm.em.create(CarDef, { brand: 'Toyota', model: 'Camry', numDoors: 4 });
      await orm.em.flush();

      car.brand = 'Honda';
      car.numDoors = 2;
      await orm.em.flush();
      orm.em.clear();

      // Verify update
      const loaded = await orm.em.findOneOrFail(CarDef, car.id);
      expect(loaded.brand).toBe('Honda');
      expect(loaded.numDoors).toBe(2);

      // Delete
      orm.em.remove(loaded);
      await orm.em.flush();
      orm.em.clear();

      // Verify deletion
      const deleted = await orm.em.findOne(CarDef, car.id);
      expect(deleted).toBeNull();

      await orm.close();
    });

    test('filtering on child properties in polymorphic query', async () => {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        entities: [VehicleDef, CarDef, MotorcycleDef],
      });

      await orm.schema.create();

      orm.em.create(CarDef, { brand: 'Toyota', model: 'Camry', numDoors: 4 });
      orm.em.create(CarDef, { brand: 'Honda', model: 'Civic', numDoors: 2 });
      orm.em.create(MotorcycleDef, { brand: 'Kawasaki', model: 'Ninja', engineCC: 600 });
      await orm.em.flush();
      orm.em.clear();

      // Filter by parent property
      const toyotas = await orm.em.find(VehicleDef, { brand: 'Toyota' });
      expect(toyotas).toHaveLength(1);

      // Filter by both parent and child properties (requires querying specific child)
      const smallCars = await orm.em.find(CarDef, { brand: 'Honda', numDoors: 2 });
      expect(smallCars).toHaveLength(1);

      await orm.close();
    });

  });

  describe('TPT with relations', () => {

    test('relation to abstract base class (owner -> vehicles)', async () => {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        entities: [OwnerDef, OwnedVehicleDef, OwnedCarDef, OwnedMotorcycleDef],
      });

      await orm.schema.create();

      // Create owner and vehicles
      const owner = orm.em.create(OwnerDef, { name: 'John' });
      const car = orm.em.create(OwnedCarDef, { brand: 'Toyota', owner, numDoors: 4 });
      const motorcycle = orm.em.create(OwnedMotorcycleDef, { brand: 'Honda', owner, engineCC: 600 });
      await orm.em.flush();
      orm.em.clear();

      // Load owner with vehicles
      const loaded = await orm.em.findOneOrFail(OwnerDef, owner.id, { populate: ['vehicles'] });
      expect(loaded.vehicles).toHaveLength(2);

      // Verify vehicles are correct types
      const loadedVehicles = loaded.vehicles.getItems();
      expect(loadedVehicles.some(v => 'numDoors' in v)).toBe(true);
      expect(loadedVehicles.some(v => 'engineCC' in v)).toBe(true);

      await orm.close();
    });

    test('loading strategies with relations', async () => {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        entities: [OwnerDef, OwnedVehicleDef, OwnedCarDef, OwnedMotorcycleDef],
      });

      await orm.schema.create();

      const owner = orm.em.create(OwnerDef, { name: 'John' });
      orm.em.create(OwnedCarDef, { brand: 'Toyota', owner, numDoors: 4 });
      orm.em.create(OwnedMotorcycleDef, { brand: 'Honda', owner, engineCC: 600 });
      await orm.em.flush();
      orm.em.clear();

      // Test with JOINED strategy
      const mock = mockLogger(orm);
      const loadedJoined = await orm.em.findOneOrFail(OwnerDef, owner.id, {
        populate: ['vehicles'],
        strategy: LoadStrategy.JOINED,
      });
      expect(loadedJoined.vehicles).toHaveLength(2);
      expect(mock.mock.calls.some(c => c[0].includes('left join'))).toBe(true);

      await orm.close();
    });

  });

  describe('multi-level TPT inheritance', () => {

    test('three-level hierarchy (Animal -> Mammal -> Dog/Cat)', async () => {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        entities: [AnimalDef, MammalDef, DogDef, CatDef],
      });

      await orm.schema.create();

      // Verify schema has all tables
      const schemaSQL = await orm.schema.getCreateSchemaSQL();
      expect(schemaSQL).toContain('animal_def');
      expect(schemaSQL).toContain('mammal_def');
      expect(schemaSQL).toContain('dog_def');
      expect(schemaSQL).toContain('cat_def');

      // Create instances
      const dog = orm.em.create(DogDef, { name: 'Buddy', breed: 'Labrador' });
      const cat = orm.em.create(CatDef, { name: 'Whiskers', indoor: true });
      await orm.em.flush();
      orm.em.clear();

      // Load and verify
      const loadedDog = await orm.em.findOneOrFail(DogDef, dog.id);
      expect(loadedDog.name).toBe('Buddy');
      expect(loadedDog.warmBlooded).toBe(true); // default value from Mammal
      expect(loadedDog.breed).toBe('Labrador');

      const loadedCat = await orm.em.findOneOrFail(CatDef, cat.id);
      expect(loadedCat.name).toBe('Whiskers');
      expect(loadedCat.warmBlooded).toBe(true);
      expect(loadedCat.indoor).toBe(true);

      // Polymorphic queries at different levels
      const animals = await orm.em.find(AnimalDef, {});
      expect(animals).toHaveLength(2);

      const mammals = await orm.em.find(MammalDef, {});
      expect(mammals).toHaveLength(2);

      await orm.close();
    });

  });

  describe('partial loading and fields', () => {

    test('partial loading with fields option', async () => {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        entities: [VehicleDef, CarDef, MotorcycleDef],
      });

      await orm.schema.create();

      orm.em.create(CarDef, { brand: 'Toyota', model: 'Camry', numDoors: 4 });
      await orm.em.flush();
      orm.em.clear();

      // Load only specific fields
      const mock = mockLogger(orm);
      const [car] = await orm.em.find(CarDef, {}, { fields: ['brand', 'numDoors'] });

      // Brand and numDoors should be loaded
      expect(car.brand).toBe('Toyota');
      expect(car.numDoors).toBe(4);

      // Check that only requested fields were queried
      const selectQuery = mock.mock.calls.find(c => c[0].includes('select'));
      expect(selectQuery).toBeDefined();

      await orm.close();
    });

  });

  describe('ordering and pagination', () => {

    test('ordering by parent and child properties', async () => {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        entities: [VehicleDef, CarDef, MotorcycleDef],
      });

      await orm.schema.create();

      orm.em.create(CarDef, { brand: 'Toyota', model: 'Camry', numDoors: 4 });
      orm.em.create(CarDef, { brand: 'Honda', model: 'Civic', numDoors: 2 });
      orm.em.create(CarDef, { brand: 'Honda', model: 'Accord', numDoors: 4 });
      await orm.em.flush();
      orm.em.clear();

      // Order by child property
      const byDoors = await orm.em.find(CarDef, {}, { orderBy: { numDoors: 'ASC' } });
      expect(byDoors[0].numDoors).toBe(2);
      expect(byDoors[2].numDoors).toBe(4);

      // Order by parent property
      const byBrand = await orm.em.find(CarDef, {}, { orderBy: { brand: 'ASC', model: 'ASC' } });
      expect(byBrand[0].brand).toBe('Honda');
      expect(byBrand[0].model).toBe('Accord');

      await orm.close();
    });

    test('pagination with limit and offset', async () => {
      const orm = await MikroORM.init({
        dbName: ':memory:',
        entities: [VehicleDef, CarDef, MotorcycleDef],
      });

      await orm.schema.create();

      // Use padded numbers for correct alphabetical sorting
      for (let i = 1; i <= 10; i++) {
        const padded = i.toString().padStart(2, '0');
        orm.em.create(CarDef, { brand: `Brand${padded}`, model: `Model${padded}`, numDoors: 4 });
      }
      await orm.em.flush();
      orm.em.clear();

      // Get page 2 with 3 items per page
      const page2 = await orm.em.find(CarDef, {}, {
        orderBy: { brand: 'ASC' },
        limit: 3,
        offset: 3,
      });

      expect(page2).toHaveLength(3);
      expect(page2[0].brand).toBe('Brand04');
      expect(page2[2].brand).toBe('Brand06');

      await orm.close();
    });

  });

});
