import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const PROJECTS = [
    {
        name: 'ys-workout',
        client: createClient(
            import.meta.env.VITE_WORKOUT_SUPABASE_URL_1,
            import.meta.env.VITE_WORKOUT_SUPABASE_KEY_1
        ),
    },
    {
        name: 'Exercises',
        client: createClient(
            import.meta.env.VITE_WORKOUT_SUPABASE_URL_2,
            import.meta.env.VITE_WORKOUT_SUPABASE_KEY_2
        ),
    },
]

const TIME_FILTERS = [
    { label: 'Heute', days: 1 },
    { label: 'Diese Woche', days: 7 },
    { label: 'Dieser Monat', days: 30 },
]

export default function SupabaseStatsWidget() {
    const [projectIdx, setProjectIdx] = useState(0)
    const [timeIdx, setTimeIdx] = useState(2) // default: Dieser Monat
    const [stats, setStats] = useState({})
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
        const interval = setInterval(fetchAll, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    // Refetch MAU when time filter changes
    useEffect(() => {
        if (Object.keys(stats).length > 0) fetchMau()
    }, [timeIdx])

    async function fetchAll() {
        setLoading(true)
        const results = { ...stats }

        await Promise.all(PROJECTS.map(async (p, i) => {
            try {
                const [sizeRes, mauRes] = await Promise.all([
                    p.client.rpc('get_db_size'),
                    p.client.rpc('get_mau', { interval_days: TIME_FILTERS[timeIdx].days }),
                ])
                results[i] = {
                    ok: true,
                    dbSize: sizeRes.data ?? null,
                    mau: mauRes.data ?? null,
                    sizeError: sizeRes.error?.message,
                    mauError: mauRes.error?.message,
                }
            } catch (e) {
                results[i] = { ok: false, error: e.message }
            }
        }))

        setStats(results)
        setLastUpdated(new Date())
        setLoading(false)
    }

    async function fetchMau() {
        const results = { ...stats }
        await Promise.all(PROJECTS.map(async (p, i) => {
            try {
                const mauRes = await p.client.rpc('get_mau', { interval_days: TIME_FILTERS[timeIdx].days })
                results[i] = {
                    ...results[i],
                    mau: mauRes.data ?? null,
                    mauError: mauRes.error?.message,
                }
            } catch (e) {
                results[i] = { ...results[i], mauError: e.message }
            }
        }))
        setStats(results)
    }

    const current = stats[projectIdx] || {}

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
                <span className="widget-title">Supabase Stats</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}></div>
                <select
                    value={projectIdx}
                    onChange={e => setProjectIdx(parseInt(e.target.value))}
                    style={{
                        background: 'var(--bg)', border: '0.5px solid var(--border)',
                        borderRadius: 6, padding: '3px 6px', fontSize: 12,
                        fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
                        fontFamily: 'system-ui',
                    }}
                >
                    {PROJECTS.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
                </select>
                <span className="badge badge-api">Supabase</span>
            </div>

            {loading ? (
                <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
                    Lädt...
                </div>
            ) : current.ok === false ? (
                <div style={{ fontSize: 13, color: '#E24B4A' }}>
                    ⚠️ {current.error}
                    <button onClick={fetchAll} style={{
                        display: 'block', marginTop: 8,
                        padding: '5px 10px', fontSize: 12,
                        background: 'var(--bg)', border: '0.5px solid var(--border)',
                        borderRadius: 6, cursor: 'pointer', color: 'var(--text)',
                    }}>Retry</button>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* DB Size */}
                    <div style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Datenbankgrösse
                        </div>
                        {current.sizeError ? (
                            <div style={{ fontSize: 12, color: '#E24B4A' }}>⚠️ {current.sizeError}</div>
                        ) : (
                            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                                {current.dbSize ?? '—'}
                            </div>
                        )}
                    </div>

                    {/* MAU */}
                    <div style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Active Users
                            </div>
                            {/* Time Filter */}
                            <div style={{ display: 'flex', gap: 2 }}>
                                {TIME_FILTERS.map((t, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setTimeIdx(i)}
                                        style={{
                                            padding: '2px 7px', fontSize: 10, cursor: 'pointer',
                                            border: '0.5px solid var(--border)',
                                            borderRadius: 6,
                                            background: timeIdx === i ? '#1D9E75' : 'var(--surface)',
                                            color: timeIdx === i ? '#fff' : 'var(--muted)',
                                            fontFamily: 'system-ui',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {current.mauError ? (
                            <div style={{ fontSize: 12, color: '#E24B4A' }}>⚠️ {current.mauError}</div>
                        ) : (
                            <>
                                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                                    {current.mau != null ? current.mau.toLocaleString('de-CH') : '—'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                                    {TIME_FILTERS[timeIdx].label.toLowerCase()}
                                </div>
                                {current.mau != null && (
                                    <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min((current.mau / 50000) * 100, 100)}%`,
                                            background: '#1D9E75',
                                            borderRadius: 2,
                                            transition: 'width 0.4s',
                                        }} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
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