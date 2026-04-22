import { useEffect, useState } from 'react'

const ACCOUNTS = {
  yannick: {
    label: 'Yannick',
    domains: [
      { label: 'yannicksalm.ch', url: 'https://yannicksalm.ch' },
      { label: 'dashboard.yannicksalm.ch', url: 'https://dashboard.yannicksalm.ch' },
      { label: 'workout.yannicksalm.ch', url: 'https://workout.yannicksalm.ch' },
      { label: 'note.yannicksalm.ch', url: 'https://note.yannicksalm.ch' },
      { label: 'template-pt-1.yannicksalm.ch', url: 'https://template-pt-1.yannicksalm.ch' },
      { label: 'template-pt-2.yannicksalm.ch', url: 'https://template-pt-2.yannicksalm.ch' },
      { label: 'template-pt-3.yannicksalm.ch', url: 'https://template-pt-3.yannicksalm.ch' },
    ]
  },
  frauenverein: {
    label: 'Frauenverein',
    domains: [
      { label: 'frauenverein-sarmenstorf.ch', url: 'https://frauenverein-sarmenstorf.ch' },
      { label: 'link.frauenverein-sarmenstorf.ch', url: 'https://link.frauenverein-sarmenstorf.ch' },
      { label: 'links.frauenverein-sarmenstorf.ch', url: 'https://links.frauenverein-sarmenstorf.ch' },
    ]
  }
}

export default function DomainsWidget() {
  const [accountKey, setAccountKey] = useState('yannick')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth < 600) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchAll() {
    setLoading(true)
    const allDomains = Object.values(ACCOUNTS).flatMap(a => a.domains)
    const checks = await Promise.all(
      allDomains.map(async (d) => {
        const start = Date.now()
        try {
          await fetch(d.url, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' })
          const ms = Date.now() - start
          return { url: d.url, ok: true, ms, speed: ms < 300 ? 'fast' : ms < 800 ? 'ok' : 'slow' }
        } catch {
          return { url: d.url, ok: false, ms: null, speed: null }
        }
      })
    )
    const map = {}
    checks.forEach(c => { map[c.url] = c })
    setResults(map)
    setLastUpdated(new Date())
    setLoading(false)
  }

  function speedColor(speed, ok) {
    if (!ok) return '#E24B4A'
    if (speed === 'fast') return '#639922'
    if (speed === 'ok') return '#BA7517'
    return '#E24B4A'
  }

  const currentDomains = ACCOUNTS[accountKey].domains
  const onlineCount = currentDomains.filter(d => results[d.url]?.ok).length

  return (
    <div style={{
      width: isMobile ? '100%' : 350,
      height: isMobile ? 'auto' : 300,
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 12,
      padding: 16,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div className="widget-header" style={{ marginBottom: 10 }}>
        <select
          value={accountKey}
          onChange={e => setAccountKey(e.target.value)}
          style={{
            background: 'var(--bg)',
            border: '0.5px solid var(--border)',
            borderRadius: 6,
            padding: '3px 6px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text)',
            cursor: 'pointer',
            fontFamily: 'system-ui',
          }}
        >
          {Object.entries(ACCOUNTS).map(([key, a]) => (
            <option key={key} value={key}>{a.label}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!loading && (
            <span style={{ fontSize: 11, color: onlineCount === currentDomains.length ? '#639922' : '#E24B4A' }}>
              {onlineCount}/{currentDomains.length} online
            </span>
          )}
          <span className="badge badge-live">live</span>
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
          Checking...
        </div>
      ) : (
        <div style={{ overflowY: isMobile ? 'visible' : 'auto', flex: 1 }}>
          {currentDomains.map((d, i) => {
            const r = results[d.url] || { ok: false, ms: null, speed: null }
            return (
              <a
                key={i}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < currentDomains.length - 1 ? '0.5px solid var(--border)' : 'none',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  borderRadius: 4,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>↗</span>
                  <span style={{
                    fontSize: 12, fontWeight: 500,
                    color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {d.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {r.ok && r.ms && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min((r.ms / 1000) * 100, 100)}%`,
                          background: speedColor(r.speed, r.ok),
                          borderRadius: 2,
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 36, textAlign: 'right' }}>
                        {r.ms}ms
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: speedColor(r.speed, r.ok) }} />
                    <span style={{ fontSize: 11, color: speedColor(r.speed, r.ok), minWidth: 36 }}>
                      {r.ok ? r.speed : 'offline'}
                    </span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, paddingTop: 6, borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{lastUpdated ? `Aktualisiert ${lastUpdated.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
        <button onClick={fetchAll} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', padding: 0 }}>
          ↻ Refresh
        </button>
      </div>
    </div>
  )
}