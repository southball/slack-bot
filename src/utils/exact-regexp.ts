import escapeStringRegexp from 'escape-string-regexp';

export function generateExactMatchRegexp(str: string): RegExp {
  return new RegExp('^' + escapeStringRegexp(str) + '$');
}
