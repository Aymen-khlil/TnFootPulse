/**
 * Vercel serverless proxy for football-data.org.
 *
 * The browser client routes `/football-data/v4/matches?...` here via the
 * vercel.json rewrite.  The function strips the local prefix, forwards
 * the request to the real API, and streams the response back — solving
 * the fd.org CORS issue (it echoes "http://localhost" as the allowed
 * origin, which never matches a production deployment).
 */
export default async function handler(
  req: { method?: string; query: Record<string, string | string[] | undefined> },
  res: {
    status: (code: number) => typeof res
    setHeader: (name: string, value: string) => typeof res
    send: (body: Buffer) => void
    json: (body: unknown) => void
  },
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // /api/football-data?path=v4/matches&dateFrom=...&dateTo=...
  const rawPath = req.query.path
  const subpath = Array.isArray(rawPath) ? rawPath[0] : rawPath

  if (!subpath) {
    return res.status(400).json({ error: 'Missing path query parameter' })
  }

  // Forward every original query param except `path` to fd.org
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v)
    } else if (value !== undefined) {
      params.set(key, value)
    }
  }

  const targetUrl = `https://api.football-data.org/${subpath}${params.toString() ? `?${params.toString()}` : ''}`

  const token = process.env.FOOTBALL_DATA_API_TOKEN

  if (!token) {
    return res.status(500).json({ error: 'FOOTBALL_DATA_API_TOKEN not configured on the server' })
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'X-Auth-Token': token },
    })

    // Stream the upstream body back with the same status
    res.status(upstream.status)
    const contentType = upstream.headers.get('content-type')
    if (contentType) res.setHeader('Content-Type', contentType)

    const body = await upstream.arrayBuffer()
    return res.send(Buffer.from(body))
  } catch (cause) {
    return res.status(502).json({
      error: 'Could not reach football-data.org',
      detail: cause instanceof Error ? cause.message : String(cause),
    })
  }
}
