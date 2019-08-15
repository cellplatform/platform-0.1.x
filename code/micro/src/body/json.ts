import { t } from '../common';
import { json as parse } from 'micro';

/**
 * Parse JSON body.
 *
 *   - limit      (example "1mb", 1024 as bytes)
 *   - encoding   (example "utf-8")
 *
 */
export async function json<T>(
  req: t.IncomingMessage,
  options: { default?: T; limit?: string | number; encoding?: string } = {},
): Promise<T> {
  try {
    const { limit, encoding } = options;
    const body = await parse(req, { limit, encoding });
    return (body === undefined ? options.default : body) as T;
  } catch (error) {
    return options.default as T;
  }
}
