const SUPABASE_URL = 'https://dxbqgumvfoluphxxjwux.supabase.co';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const targetURL = SUPABASE_URL + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.set('Host', new URL(SUPABASE_URL).host);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    const response = await fetch(targetURL, {
      method: request.method,
      headers,
      redirect: 'manual',
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? request.body
        : undefined,
    });

    // For redirects (3xx), pass the Location header through directly.
    // The browser will follow the redirect to Google, Supabase, etc.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      if (location) {
        return Response.redirect(location, response.status);
      }
    }

    // For normal responses, add CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
};
