/**
 * The fixed-point combinator.
 */
export function fix<S, T>(f: (_: (_: S) => T) => (_: S) => T): (_: S) => T {
  type U = (_: U) => (_: S) => T;
  return ((x: U) => f((y) => x(x)(y)))((x) => f((y) => x(x)(y)));
}
