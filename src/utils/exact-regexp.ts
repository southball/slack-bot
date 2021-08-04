import escapeStringRegexp from 'escape-string-regexp';

/**
 * Generates a RegExp that matches the passed string exactly.
 */
export function generateExactMatchRegexp(str: string): RegExp {
  return new RegExp('^' + escapeStringRegexp(str) + '$');
}
