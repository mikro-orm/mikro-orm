// extracted and modified from npm package "fast-json-stable-hash"
export function stableStringify(obj: any): string {
    const type = typeof obj;
    if (type === 'string') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      let str = '[';
      const al = obj.length - 1;
      for (let i = 0; i < obj.length; i++) {
        str += stableStringify(obj[i]);
        if (i !== al) {
          str += ',';
        }
      }
      return `${str}]`;
    }
    if (type === 'object' && obj !== null) {
      let str = '{';
      const keys = Object.keys(obj).sort();
      const kl = keys.length - 1;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const val = (obj as any)[key];
        if (val === undefined) {
          continue;
        }
        if (i !== 0) {
          str += ',';
        }
        str += `${JSON.stringify(key)}:${stableStringify(val)}`;
      }
      return `${str}}`;
    }
    if (type === 'number' || type === 'boolean' || obj == null) {
      // bool, num, null have correct auto-coercions
      return `${obj}`;
    }

    throw new TypeError(`Invalid JSON type of ${type}, value ${obj}. FJSH can only hash JSON objects.`);
  }
