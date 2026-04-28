import { useEffect, useState } from 'react'

const PROXY = 'https://cf-proxy.yannicksalm.ch'

const ACCOUNTS = [
    { name: 'Yannick',      accountId: import.meta.env.VITE_CF_ACCOUNT_ID_1 },
    { name: 'Frauenverein', accountId: import.meta.env.VITE_CF_ACCOUNT_ID_2 },
]

export default function CloudflareWidget() {
    const [accountIdx, setAccountIdx] = useState(0)
    const [tab, setTab] = useState('all')
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

    useEffect(() => { fetchData() }, [accountIdx])

    async function fetchData() {
        setLoading(true)
        setError(null)
        const account = ACCOUNTS[accountIdx]
        if (!account.accountId) {
            setError('Account ID fehlt in .env')
            setLoading(false)
            return
        }
        try {
            const [pagesRes, workersRes] = await Promise.all([
                fetch(`${PROXY}?account=${account.accountId}&type=pages`),
                fetch(`${PROXY}?account=${account.accountId}&type=workers`),
            ])
            if (!pagesRes.ok) throw new Error(`Proxy Fehler ${pagesRes.status}`)
            const pagesData = await pagesRes.json()
            const workersData = await workersRes.json()
            setPages(pagesData.success ? pagesData.result : [])
            setWorkers(workersData.success ? workersData.result : [])
            setLastUpdated(new Date())
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    function statusColor(status) {
        if (status === 'success' || status === 'active') return '#639922'
        if (status === 'failure' || status === 'failed') return '#E24B4A'
        return '#BA7517'
    }

    function statusLabel(status) {
        if (status === 'success') return 'deployed'
        if (status === 'active') return 'active'
        if (status === 'failure' || status === 'failed') return 'failed'
        return status || 'unknown'
    }

    function isError(status) {
        return status === 'failure' || status === 'failed' || status === 'unknown'
    }

    function timeAgo(dateStr) {
        if (!dateStr) return '—'
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
        if (diff < 60) return 'gerade eben'
        if (diff < 3600) return `vor ${Math.floor(diff / 60)}min`
        if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`
        return `vor ${Math.floor(diff / 86400)}d`
    }

    // Build items per tab — errors/down first
    const pageItems = pages.map(p => {
        const deploy = p.latest_deployment
        const status = deploy?.stage?.status || (deploy ? 'success' : 'unknown')
        return { id: p.id, name: p.name, sub: p.subdomain, branch: deploy?.deployment_trigger?.metadata?.branch || p.production_branch || 'main', date: deploy?.created_on, status, type: 'Pages', error: isError(status) }
    })

    const workerItems = workers.map(w => ({
        id: w.id, name: w.id, sub: null, branch: null, date: w.modified_on, status: 'active', type: 'Worker', error: false
    }))

    function sortErrorFirst(items) {
        return [...items].sort((a, b) => (b.error ? 1 : 0) - (a.error ? 1 : 0))
    }

    const allItems = sortErrorFirst([...pageItems, ...workerItems])
    const currentItems = tab === 'all' ? allItems : tab === 'pages' ? sortErrorFirst(pageItems) : sortErrorFirst(workerItems)

    const errorCount = allItems.filter(i => i.error).length

    const tabs = [
        { key: 'all',     label: 'Alle',    count: allItems.length },
        { key: 'pages',   label: 'Pages',   count: pageItems.length },
        { key: 'workers', label: 'Workers', count: workerItems.length },
    ]

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
                <span className="widget-title">Cloudflare</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {errorCount > 0 && (
                        <span style={{ fontSize: 10, padding: '2px 6px', background: '#FEE2E2', color: '#E24B4A', borderRadius: 20 }}>
                            {errorCount} Fehler
                        </span>
                    )}
                    <select
                        value={accountIdx}
                        onChange={e => setAccountIdx(parseInt(e.target.value))}
                        style={{
                            background: 'var(--bg)', border: '0.5px solid var(--border)',
                            borderRadius: 6, padding: '3px 6px', fontSize: 12,
                            fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
                            fontFamily: 'system-ui',
                        }}
                    >
                        {ACCOUNTS.map((a, i) => <option key={i} value={i}>{a.name}</option>)}
                    </select>
                    <span className="badge badge-api">Cloudflare</span>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid var(--border)', marginBottom: 10 }}>
                {tabs.map(t => (
                    <div key={t.key} onClick={() => setTab(t.key)} style={{
                        padding: '5px 10px', fontSize: 12, cursor: 'pointer',
                        color: tab === t.key ? '#1D9E75' : 'var(--muted)',
                        borderBottom: tab === t.key ? '2px solid #1D9E75' : '2px solid transparent',
                        marginBottom: -1,
                    }}>
                        {t.label} {!loading && `(${t.count})`}
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
                    Nichts gefunden
                </div>
            ) : (
                <div style={{ overflowY: isMobile ? 'visible' : 'auto', flex: 1 }}>
                    {currentItems.map((item, i) => (
                        <div key={item.id + i} style={{
                            padding: '8px 0',
                            borderBottom: i < currentItems.length - 1 ? '0.5px solid var(--border)' : 'none',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
                            background: item.error ? 'rgba(226,75,74,0.04)' : 'transparent',
                            borderRadius: item.error ? 4 : 0,
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.name}
                                    </span>
                                    <span style={{ fontSize: 10, padding: '1px 5px', background: 'var(--bg)', borderRadius: 10, color: 'var(--muted)', flexShrink: 0 }}>
                                        {item.type}
                                    </span>
                                </div>
                                {item.sub && (
                                    <div style={{ fontSize: 11, color: '#378ADD', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.sub}
                                    </div>
                                )}
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                                    {item.branch && <span>{item.branch} · </span>}
                                    {timeAgo(item.date)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(item.status) }}/>
                                <span style={{ fontSize: 11, color: statusColor(item.status) }}>{statusLabel(item.status)}</span>
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