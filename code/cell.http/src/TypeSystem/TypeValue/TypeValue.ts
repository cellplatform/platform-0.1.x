import { t, Schema, deleteUndefined } from '../common';
import { tokenize } from './tokenize';

type Parsed = { type: t.IType; input: string };
type U = t.ITypeUnion;

/**
 * Parser for interpreting a type value.
 */
export class TypeValue {
  public static token = tokenize;

  /**
   * Determine if the given value is a reference to another type.
   */
  public static isRef(input?: string) {
    if (typeof input !== 'string') {
      return false;
    } else {
      const is = Schema.uri.is;
      return is.ns(input) || is.column(input);
    }
  }

  /**
   * Determines if the given input represents an array of types.
   * eg:
   *    - string[]
   *    - ns:foo[]
   *    - (string | ns:foo)[]
   */
  public static isArray(input?: string) {
    if (typeof input !== 'string') {
      return false;
    } else {
      const value = input.trim();
      if (value.startsWith('(')) {
        const isMatch = Boolean(value.match(/^\((.+)\)\[\]$/));
        return isMatch && value.replace(/\s/g, '') !== '()[]';
      } else {
        return Boolean(value.match(/[\w\d"']\[\]$/));
      }
    }
  }

  /**
   * Determines if the given input represents a group.
   * eg:
   *    - (string)
   *    - (string | boolean)
   *    - (string | ns:foo)[]
   */
  public static isGroup(input?: string) {
    if (typeof input !== 'string') {
      return false;
    } else {
      const value = input.trim();
      return value.startsWith('(') && (value.endsWith(')') || value.endsWith(')[]'));
    }
  }

  /**
   * Removes the "[]" suffix from a string.
   */
  public static trimArray(input?: string) {
    return typeof input !== 'string' ? '' : (input || '').trim().replace(/\[\]$/, '');
  }

  /**
   * Removes single-quotes (') and double-quotes ("") from the given string.
   */
  public static trimQuotes(input?: string) {
    return typeof input !== 'string'
      ? ''
      : (input || '')
          .trim()
          .replace(/^["']/, '')
          .replace(/["']$/, '')
          .trim();
  }

  /**
   * Parses an input 'type' declared on a column into a [Type] object.
   */
  public static parse(input?: string): Parsed {
    // Setup initial conditions.
    const value = (typeof input === 'string' ? input : '').trim();
    const isArray = TypeValue.isArray(value) ? true : undefined;
    const unknown: t.ITypeUnknown = { kind: 'UNKNOWN', typename: value, isArray };

    const done = (input?: Parsed): Parsed => {
      return deleteUndefined(input || { type: unknown, input: value });
    };

    if (typeof input !== 'string' || !value) {
      return done();
    }

    let result: Parsed | undefined;
    let next = value;

    const tokenToType = (token: t.ITypeToken) => {
      if (token.kind === 'VALUE') {
        return TypeValue.toType(token.text);
      }

      if (token.kind === 'GROUP' || token.kind === 'GROUP[]') {
        const type = TypeValue.parse(token.text).type; // <== RECURSION 🌳
        if (token.kind === 'GROUP[]') {
          type.isArray = true;
          type.typename = type.kind === 'UNION' ? `(${type.typename})[]` : `${type.typename}[]`;
        }
        return type;
      }

      const unknown: t.ITypeUnknown = { kind: 'UNKNOWN', typename: token.input };
      return unknown;
    };

    do {
      const token = tokenize.next(next);
      next = token.next;

      if (next) {
        // UNION of several types.
        if (!result) {
          const union: U = { kind: 'UNION', typename: token.input, types: [] };
          result = { type: union, input: value };
        }
        (result.type as U).types.push(tokenToType(token));
      } else {
        // LAST type (or ONLY type).
        if (result?.type.kind === 'UNION') {
          (result.type as U).types.push(tokenToType(token));
        } else {
          result = { type: tokenToType(token), input: value };
        }
      }
    } while (next);

    // If UNION only has one type within it, elevate that type to be the root type.
    if (result.type.kind === 'UNION' && result.type.types.length === 1) {
      result.type = result.type.types[0];
    }

    // Clean up UNION typename.
    if (result.type.kind === 'UNION') {
      const type = result.type;
      let typename = type.types
        .map(type => {
          let typename = type.typename;
          if (type.kind === 'UNION') {
            typename = `(${typename})`;
          }
          if (type.kind === 'REF') {
            typename = type.isArray ? `${type.uri}[]` : type.uri;
          }
          return typename;
        })
        .join(' | ');
      typename = type.isArray ? `(${typename})[]` : typename;
      result.type = { ...type, typename };
    }

    // Finish up.
    return done(result);
  }

  /**
   * Parses a single input 'type' value into an [IType] object.
   * NOTE:
   *    This method does not understand groups (eg "(...)").
   */
  public static toType(input?: string): t.IType {
    // Setup initial conditions.
    const value = (typeof input === 'string' ? input : '').trim();
    const isArray = TypeValue.isArray(value) ? true : undefined;

    const unknown: t.ITypeUnknown = deleteUndefined({ kind: 'UNKNOWN', typename: value, isArray });
    if (typeof input !== 'string' || !value) {
      return unknown;
    }

    // Parse out VALUE types.
    const TYPES = ['string', 'number', 'boolean', 'null', 'undefined'];
    for (const type of TYPES) {
      const match = isArray ? value.replace(/\[\]$/, '') : value;
      if (type === match) {
        const typename = value as t.ITypeValue['typename'];
        const type: t.ITypeValue = { kind: 'VALUE', typename, isArray };
        return deleteUndefined(type);
      }
    }

    // Parse out REF types.
    if (TypeValue.isRef(value)) {
      // NOTE:  The type-ref is a stub, and will require doing a lookup
      //        with an HTTP client to resolve the final typename/types
      //        defined in the remote "ns".
      const uri = TypeValue.trimArray(value);
      const is = Schema.uri.is;
      const scope: t.ITypeRef['scope'] = is.ns(uri) ? 'NS' : is.column(uri) ? 'COLUMN' : 'UNKNOWN';
      const type: t.ITypeRef = { kind: 'REF', uri, scope, typename: '', isArray, types: [] };
      return deleteUndefined(type);
    }

    // Parse out ENUM types.
    if (value.includes(`'`) || value.includes(`"`)) {
      const formatEnum = (typename: string, isArray?: boolean) => {
        typename = TypeValue.trimQuotes(TypeValue.trimArray(typename));
        return `'${typename}'${isArray ? '[]' : ''}`;
      };

      const enums = value.split('|').map(item => {
        const isArray = TypeValue.isArray(item) ? true : undefined;
        const typename = formatEnum(item, isArray);
        const type: t.ITypeEnum = { kind: 'ENUM', typename, isArray };
        return deleteUndefined(type);
      });

      if (enums.length === 1) {
        return enums[0];
      } else {
        const typename = enums
          .map(({ typename, isArray }) => formatEnum(typename, isArray))
          .join(' | ');
        const union: U = { kind: 'UNION', typename, types: enums };
        return deleteUndefined(union);
      }
    }

    // No match.
    return unknown;
  }
}
