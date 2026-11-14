import serverless from 'serverless-http';
import { createApp } from '../app-server.js';
export function expressHandler(storage) {
  const invoke = serverless(createApp(storage, { hosted: true }), {
    binary: ['application/octet-stream', 'image/jpeg', 'image/png']
  });
  return async (request, context) => {
    const url = new URL(request.url);
    const headers = Object.fromEntries(request.headers);
    headers.host = url.host;
    const body = request.body ? Buffer.from(await request.arrayBuffer()).toString('base64') : null;
    const result = await invoke({
      httpMethod: request.method,
      path: url.pathname,
      headers,
      multiValueQueryStringParameters: Object.fromEntries(
        [...new Set(url.searchParams.keys())].map(key => [key, url.searchParams.getAll(key)])
      ),
      requestContext: { identity: { sourceIp: context.ip } },
      body,
      isBase64Encoded: body !== null
    });
    const responseHeaders = new Headers(result.headers);
    for (const [name, values] of Object.entries(result.multiValueHeaders || {})) {
      responseHeaders.delete(name);
      for (const value of values) responseHeaders.append(name, value);
    }
    const responseBody = request.method === 'HEAD' || [204, 205, 304].includes(result.statusCode) ? null :
      result.isBase64Encoded ? Buffer.from(result.body, 'base64') : result.body;
    return new Response(responseBody, { status: result.statusCode, headers: responseHeaders });
  };
}
