import { useEffect, useState } from 'react'

const ACCOUNTS = [
    { name: 'Yannick', token: import.meta.env.VITE_CF_TOKEN_1, accountId: import.meta.env.VITE_CF_ACCOUNT_ID_1 },
    { name: 'Spaceholder', token: import.meta.env.VITE_CF_TOKEN_2, accountId: import.meta.env.VITE_CF_ACCOUNT_ID_2 },
]

export default function CloudflareWidget() {
    const [accountIdx, setAccountIdx] = useState(0)
    const [tab, setTab] = useState('pages')
    const [pages, setPages] = useState([])
    const [workers, setWorkers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(null)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 600)

    useEffect(() => {
        function handleResize() { setIsMobile(window.innerWidth < 600) }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        fetchData()
    }, [accountIdx])

    async function fetchData() {
        setLoading(true)
        setError(null)
        const account = ACCOUNTS[accountIdx]
        if (!account.token || !account.accountId) {
            setError('API Token oder Account ID fehlt in .env')
            setLoading(false)
            return
        }

        const headers = { 'Authorization': `Bearer ${account.token}` }

        try {
            const [pagesRes, workersRes] = await Promise.all([
                fetch(`https://api.cloudflare.com/client/v4/accounts/${account.accountId}/pages/projects`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${account.accountId}/workers/scripts`, { headers }),
            ])

            const pagesData = await pagesRes.json()
            const workersData = await workersRes.json()

            if (!pagesRes.ok) throw new Error(pagesData.errors?.[0]?.message || `Pages Fehler ${pagesRes.status}`)

            setPages(pagesData.success ? pagesData.result : [])
            setWorkers(workersData.success ? workersData.result : [])
            setLastUpdated(new Date())
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    function deployStatusColor(status) {
        if (status === 'success') return '#639922'
        if (status === 'failure' || status === 'failed') return '#E24B4A'
        if (status === 'active') return '#639922'
        return '#BA7517'
    }

    function deployStatusLabel(status) {
        if (status === 'success') return 'deployed'
        if (status === 'failure' || status === 'failed') return 'failed'
        if (status === 'active') return 'active'
        return status || 'unknown'
    }

    function timeAgo(dateStr) {
        if (!dateStr) return '—'
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
        if (diff < 60) return 'gerade eben'
        if (diff < 3600) return `vor ${Math.floor(diff / 60)}min`
        if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`
        return `vor ${Math.floor(diff / 86400)}d`
    }

    const currentItems = tab === 'pages' ? pages : workers

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
                <select
                    value={accountIdx}
                    onChange={e => setAccountIdx(parseInt(e.target.value))}
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
                    {ACCOUNTS.map((a, i) => (
                        <option key={i} value={i}>{a.name}</option>
                    ))}
                </select>
                <span className="badge badge-api">Cloudflare</span>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '0.5px solid var(--border)', marginBottom: 10 }}>
                {['pages', 'workers'].map(t => (
                    <div key={t} onClick={() => setTab(t)} style={{
                        padding: '5px 10px', fontSize: 12, cursor: 'pointer',
                        color: tab === t ? '#1D9E75' : 'var(--muted)',
                        borderBottom: tab === t ? '2px solid #1D9E75' : '2px solid transparent',
                        marginBottom: -1, textTransform: 'capitalize',
                    }}>
                        {t} {t === 'pages' ? `(${pages.length})` : `(${workers.length})`}
                    </div>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>Lädt...</div>
            ) : error ? (
                <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 13, color: '#E24B4A', marginBottom: 8 }}>⚠️ {error}</div>
                    <button onClick={fetchData} style={{
                        padding: '5px 10px', fontSize: 12,
                        background: 'var(--bg)', border: '0.5px solid var(--border)',
                        borderRadius: 6, cursor: 'pointer', color: 'var(--text)',
                    }}>Retry</button>
                </div>
            ) : currentItems.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)', padding: '16px 0', textAlign: 'center' }}>
                    Keine {tab === 'pages' ? 'Pages' : 'Workers'} gefunden
                </div>
            ) : (
                <div style={{ overflowY: isMobile ? 'visible' : 'auto', flex: 1 }}>
                    {tab === 'pages' && pages.map((p, i) => {
                        const deploy = p.latest_deployment
                        const status = deploy?.stage?.status || 'unknown'
                        return (
                            <div key={p.id} style={{
                                padding: '8px 0',
                                borderBottom: i < pages.length - 1 ? '0.5px solid var(--border)' : 'none',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Project name */}
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.name}
                                        </div>
                                        {/* URL */}
                                        {p.subdomain && (
                                            <div style={{ fontSize: 11, color: '#378ADD', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p.subdomain}
                                            </div>
                                        )}
                                        {/* Meta */}
                                        <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>
                                            <span>Branch: {deploy?.deployment_trigger?.metadata?.branch || p.production_branch || 'main'}</span>
                                            <span>{timeAgo(deploy?.created_on)}</span>
                                        </div>
                                    </div>
                                    {/* Status */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: deployStatusColor(status) }} />
                                        <span style={{ fontSize: 11, color: deployStatusColor(status) }}>
                                            {deployStatusLabel(status)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {tab === 'workers' && workers.map((w, i) => (
                        <div key={w.id} style={{
                            padding: '8px 0',
                            borderBottom: i < workers.length - 1 ? '0.5px solid var(--border)' : 'none',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {w.id}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                    {timeAgo(w.modified_on)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#639922' }} />
                                <span style={{ fontSize: 11, color: '#639922' }}>active</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, paddingTop: 6, borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{lastUpdated ? `Aktualisiert ${lastUpdated.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                <button onClick={fetchData} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', padding: 0 }}>
                    ↻ Refresh
                </button>
            </div>
        </div>
    )
}