import { send } from 'micro';

import { t, time } from '../common';

const NOT_FOUND: t.RouteResponse = {
  status: 404,
  data: { status: 404, message: 'Not found' },
};

/**
 * Handles an HTTP request.
 */
export function requestHandler(args: { router: t.Router; fire: t.FireEvent }): t.RouteHandler {
  const { router, fire } = args;

  return async (incoming, outgoing) => {
    const req = incoming as unknown as t.IncomingMessage;
    const res = outgoing as unknown as t.ServerResponse;

    const timer = time.timer();
    const method = req.method as t.HttpMethod;
    const url = req.url || '';
    let handled: t.RouteResponse | undefined;

    type P = Promise<void> | undefined;
    const modifying = {
      request: undefined as P,
      response: undefined as P,
    };

    // Fire BEFORE-event.
    let context: any = {};
    const before: t.MicroRequest = {
      isModified: false,
      method,
      url,
      req,
      modify(input) {
        if (input) {
          before.isModified = true;

          const modify = (options: { context?: any; response?: t.RouteResponse } = {}) => {
            if (options.context) context = options.context;
            if (options.response) handled = options.response;
          };

          if (typeof input !== 'function') {
            modify(input);
          } else {
            modifying.request = new Promise<void>(async (resolve) => {
              try {
                modify(await input());
                resolve();
              } catch (error) {
                before.error = error.message;
              }
            });
          }
        }
      },
    };
    fire({ type: 'SERVICE/request', payload: before });

    // Wait for the request modification [Promise] to complete
    // if an event listener modified the payload asynchronously.
    if (modifying.request) {
      await modifying.request;
    }

    // Handle the request.
    if (!handled) {
      handled = (await router.handler(req as unknown as t.RouteRequest, context)) || NOT_FOUND;
    }

    // Fire AFTER-event.
    const after: t.MicroResponse = {
      elapsed: timer.elapsed,
      isModified: false,
      context,
      method,
      url,
      req,
      res: { ...handled },
      modify(input) {
        if (input) {
          after.isModified = true;
          if (typeof input !== 'function') {
            handled = input;
          } else {
            modifying.response = new Promise<void>(async (resolve) => {
              try {
                handled = await input();
                after.elapsed = timer.elapsed;
                resolve();
              } catch (error) {
                after.error = error.message;
              }
            });
          }
        }
      },
    };
    fire({ type: 'SERVICE/response', payload: after });

    // Wait for the response modification [Promise] to complete
    // if an event listener modified the payload asynchronously.
    if (modifying.response) {
      await modifying.response;
    }

    // Prepare for sending.
    setHeaders(res, handled.headers);
    const status = handled.status || 200;

    if (status.toString().startsWith('3')) {
      redirect(res, status, handled.data);
    } else {
      await send(res, status, handled.data);
    }
    return undefined;
  };
}

/**
 * [Helpers]
 */
function redirect(res: t.ServerResponse, statusCode: number, location: string) {
  if (!location) {
    throw new Error('Redirect location required');
  }
  res.statusCode = statusCode;
  res.setHeader('Location', location);
  res.end();
}

function setHeaders(res: t.ServerResponse, headers?: t.HttpHeaders) {
  if (headers) {
    Object.keys(headers).forEach((key) => res.setHeader(key, headers[key]));
  }
}
