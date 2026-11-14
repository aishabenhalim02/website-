import { expressHandler } from '../express-handler.js';
import { netlifyStorage } from '../storage.js';

let handle;

export const config = { path: ['/api/*', '/healthz'] };

export default async function mms(request, context) {
  handle ??= expressHandler(netlifyStorage(context.deploy.context));
  return handle(request, context);
}
