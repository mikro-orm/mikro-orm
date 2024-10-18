import { Author4, Publisher4 } from '../../entities-schema';

describe('SchemaValidator', () => {
  test('should validate input', () => {
    Author4.init();
    const result = Author4.validator.validate({ value: {
        name: 'John',
        email: 'john@example.com',
    } }, { fillWithDefault: true });

    expect(result).toEqual({
      value: {
        name: 'John',
        email: 'john@example.com',
      },
    });
  });

  test('should failed with empty data', () => {
    Author4.init();
    expect(Author4['~validate']({ value: null }).issues?.[0].message).toMatch('input value is empty');
    expect(Author4['~validate']({ value: 1 }).issues?.[0].message).toMatch('input value is not an object');
  });

  test('should validate enum', () => {
    Publisher4.init();
    const result = Publisher4['~validate']({ value: {
      name: 'John',
      type: 'publisher',
    } });

    expect(result.issues).toMatchObject([{ message:'invalid enum value', path: ['type'] }]);
  });

  test('should validate required property', () => {
    Publisher4.init();
    const result = Publisher4['~validate']({ value: {
      name: 'John',
    } });

    expect(result.issues).toMatchObject([{ message:'type is required', path: ['type'] }]);
  });

  test('should validate array', () => {
    Author4.init();
    const result1 = Author4['~validate']({ value: {
      name: 'John',
      termsAccepted: false,
      email: 'john@example.com',
      identities: 6,
    } });

    expect(result1.issues).toMatchObject([{ message:'invalid string[] value', path: ['identities'] }]);

    const result2 = Author4['~validate']({ value: {
      name: 'John',
      termsAccepted: false,
      email: 'john@example.com',
      identities: null,
    } });

    expect(result2.issues).toBeUndefined();


    const result3 = Author4['~validate']({ value: {
      name: 'John',
      termsAccepted: false,
      email: 'john@example.com',
      identities: [6],
    } });

    expect(result3.issues).toMatchObject([{ message:'invalid string[] value', path: ['identities', 0] }]);
  });

});
