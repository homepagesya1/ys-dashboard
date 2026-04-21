import { useEffect, useState } from 'react'

const DB1 = {
  url: import.meta.env.VITE_WORKOUT_SUPABASE_URL_1,
  key: import.meta.env.VITE_WORKOUT_SUPABASE_KEY_1,
  label: 'Main DB',
  tables: ['equipment', 'exercise_types', 'exercises', 'muscles', 'personal_records', 'profiles', 'routine_exercises', 'routine_sets', 'routines', 'sets', 'workout_exercises', 'workout_sessions'],
}

const DB2 = {
  url: import.meta.env.VITE_WORKOUT_SUPABASE_URL_2,
  key: import.meta.env.VITE_WORKOUT_SUPABASE_KEY_2,
  label: 'Exercises DB',
  tables: ['exercises'],
}

const WORKER_URL = 'https://workout.yannicksalm.ch'

export default function YsWorkoutWidget() {
  const [workerStatus, setWorkerStatus] = useState(null)
  const [workerMs, setWorkerMs] = useState(null)
  const [db1, setDb1] = useState(null)
  const [db2, setDb2] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [tab, setTab] = useState('status')
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
    await Promise.all([checkWorker(), checkDb(DB1, setDb1), checkDb(DB2, setDb2)])
    setLastUpdated(new Date())
    setLoading(false)
  }

  async function checkWorker() {
    const start = Date.now()
    try {
      await fetch(WORKER_URL, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' })
      setWorkerStatus(true)
      setWorkerMs(Date.now() - start)
    } catch {
      setWorkerStatus(false)
      setWorkerMs(null)
    }
  }

  async function checkDb(db, setter) {
    if (!db.url || !db.key) {
      setter({ error: 'Keys fehlen in .env', tables: [] })
      return
    }
    try {
      // Check realtime connection + table counts
      const results = await Promise.all(
        db.tables.map(async (table) => {
          try {
            const res = await fetch(
              `${db.url}/rest/v1/${table}?select=count`,
              {
                headers: {
                  'apikey': db.key,
                  'Authorization': `Bearer ${db.key}`,
                  'Prefer': 'count=exact',
                  'Range': '0-0',
                }
              }
            )
            const count = res.headers.get('content-range')?.split('/')[1] || '?'
            return { table, count, ok: res.ok }
          } catch {
            return { table, count: '?', ok: false }
          }
        })
      )

      // DB size via pg_total_relation_size (rpc)
      let dbSize = null
      try {
        const sizeRes = await fetch(`${db.url}/rest/v1/rpc/get_db_size`, {
          method: 'POST',
          headers: {
            'apikey': db.key,
            'Authorization': `Bearer ${db.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        })
        if (sizeRes.ok) {
          const sizeData = await sizeRes.json()
          dbSize = sizeData
        }
      } catch { /* RPC nicht verfügbar */ }

      setter({ tables: results, dbSize, ok: true })
    } catch (e) {
      setter({ error: e.message, tables: [] })
    }
  }

  function statusDot(ok) {
    return (
      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: ok === null ? '#BA7517' : ok ? '#639922' : '#E24B4A'
      }}/>
    )
  }

  function statusText(ok) {
    if (ok === null) return { text: 'checking', color: '#BA7517' }
    return ok
      ? { text: 'online', color: '#639922' }
      : { text: 'offline', color: '#E24B4A' }
  }

  const workerSt = statusText(workerStatus)

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
      <div className="widget-header" style={{ marginBottom: 8 }}>
        <span className="widget-title">ys-workout</span>
        <span className="badge badge-api">Monitor</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '0.5px solid var(--border)', marginBottom: 10 }}>
        {['status', 'main db', 'exercises db'].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{
            padding: '5px 8px', fontSize: 11, cursor: 'pointer',
            color: tab === t ? '#1D9E75' : 'var(--muted)',
            borderBottom: tab === t ? '2px solid #1D9E75' : '2px solid transparent',
            marginBottom: -1, textTransform: 'capitalize', whiteSpace: 'nowrap',
          }}>
            {t}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>Prüfe...</div>
      ) : (
        <div style={{ overflowY: isMobile ? 'visible' : 'auto', flex: 1 }}>

          {/* Status Tab */}
          {tab === 'status' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Worker */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Worker</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{WORKER_URL.replace('https://', '')}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {statusDot(workerStatus)}
                    <span style={{ fontSize: 11, color: workerSt.color }}>{workerSt.text}</span>
                  </div>
                  {workerMs && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{workerMs}ms</span>}
                </div>
              </div>

              {/* DB1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Main DB</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {db1?.tables?.length || 0} Tabellen · {db1?.tables?.reduce((s, t) => s + (parseInt(t.count) || 0), 0).toLocaleString()} Einträge
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {statusDot(db1?.ok ?? null)}
                  <span style={{ fontSize: 11, color: db1?.ok ? '#639922' : '#E24B4A' }}>
                    {db1?.ok ? 'connected' : db1?.error ? 'error' : 'checking'}
                  </span>
                </div>
              </div>

              {/* DB2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Exercises DB</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {db2?.tables?.[0]?.count ? `${parseInt(db2.tables[0].count).toLocaleString()} Einträge` : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {statusDot(db2?.ok ?? null)}
                  <span style={{ fontSize: 11, color: db2?.ok ? '#639922' : '#E24B4A' }}>
                    {db2?.ok ? 'connected' : db2?.error ? 'error' : 'checking'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Main DB Tab */}
          {tab === 'main db' && (
            <div>
              {db1?.error ? (
                <div style={{ fontSize: 13, color: '#E24B4A' }}>⚠️ {db1.error}</div>
              ) : db1?.tables?.map((t, i) => (
                <div key={t.table} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0', borderBottom: i < db1.tables.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {statusDot(t.ok)}
                    <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'monospace' }}>{t.table}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {t.count !== '?' ? parseInt(t.count).toLocaleString() : '?'} rows
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Exercises DB Tab */}
          {tab === 'exercises db' && (
            <div>
              {db2?.error ? (
                <div style={{ fontSize: 13, color: '#E24B4A' }}>⚠️ {db2.error}</div>
              ) : db2?.tables?.map((t, i) => (
                <div key={t.table} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0', borderBottom: i < db2.tables.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {statusDot(t.ok)}
                    <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'monospace' }}>{t.table}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {t.count !== '?' ? parseInt(t.count).toLocaleString() : '?'} rows
                  </span>
                </div>
              ))}
            </div>
          )}

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