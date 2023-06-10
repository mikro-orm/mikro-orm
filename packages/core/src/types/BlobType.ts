import { Uint8ArrayType } from './Uint8ArrayType';

export class BlobType extends Uint8ArrayType {

  convertToJSValue(value: Buffer): Buffer | null {
    if (value as unknown instanceof Buffer || !value) {
      return value;
    }

    /* istanbul ignore else */
    if (value.buffer instanceof Buffer) {
      return value.buffer;
    }

    /* istanbul ignore next */
    return Buffer.from(value);
  }

}
