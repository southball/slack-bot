const getCircularReplacer = () => {
  const cache = new WeakSet();
  return (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return;
      }
      cache.add(value);
    }
    return value;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function stringifyWithCircularReference(object: any): string {
  return JSON.stringify(object, getCircularReplacer(), 2);
}
