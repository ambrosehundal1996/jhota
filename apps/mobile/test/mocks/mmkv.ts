type Value = string | number | boolean | ArrayBuffer;

export function createMMKV() {
  const map = new Map<string, Value>();
  return {
    set: (key: string, value: Value) => void map.set(key, value),
    getString: (key: string) => {
      const v = map.get(key);
      return typeof v === 'string' ? v : undefined;
    },
    getBoolean: (key: string) => {
      const v = map.get(key);
      return typeof v === 'boolean' ? v : undefined;
    },
    getNumber: (key: string) => {
      const v = map.get(key);
      return typeof v === 'number' ? v : undefined;
    },
    remove: (key: string) => map.delete(key),
    contains: (key: string) => map.has(key),
    getAllKeys: () => [...map.keys()],
    clearAll: () => map.clear(),
  };
}
