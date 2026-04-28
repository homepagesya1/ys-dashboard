addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  const url = new URL(request.url)
  const ref = url.searchParams.get('ref')
  const type = url.searchParams.get('type')

  if (!ref || !type) {
    return new Response(JSON.stringify({ error: 'ref und type erforderlich' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  const headers = {
    'Authorization': `Bearer ${SUPABASE_PAT}`,
    'Content-Type': 'application/json',
  }

  let cfUrl, method = 'GET', body = undefined

  if (type === 'usage') {
    cfUrl = `https://api.supabase.com/v1/projects/${ref}/usage`
  } else if (type === 'mau') {
    cfUrl = `https://api.supabase.com/v1/projects/${ref}/database/query`
    method = 'POST'
    body = JSON.stringify({
      query: "SELECT COUNT(DISTINCT id)::int as mau FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '30 days'"
    })
  } else {
    return new Response(JSON.stringify({ error: 'Ungültiger type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  try {
    const response = await fetch(cfUrl, { method, headers, body })
    const text = await response.text()

    return new Response(text, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}