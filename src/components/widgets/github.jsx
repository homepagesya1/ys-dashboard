import { useEffect, useState } from 'react'

const ACCOUNTS = ['Sky-Walker-xlsr', 'homepagesya1'] // deine GitHub Usernames hier

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Shell: '#89e051',
  Rust: '#dea584',
}

export default function GitHubWidget() {
  const [account, setAccount] = useState(ACCOUNTS[0])
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth < 600) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchRepos(account)
  }, [account])

  async function fetchRepos(username) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=50&sort=pushed&direction=desc`,
        { headers: { Accept: 'application/vnd.github+json' } }
      )
      if (res.status === 404) throw new Error(`Account "${username}" nicht gefunden`)
      if (res.status === 403) throw new Error('GitHub API Rate Limit erreicht — kurz warten')
      if (!res.ok) throw new Error(`GitHub Fehler ${res.status}`)
      const data = await res.json()
      // sort by last push (already sorted by API, but just to be sure)
      const sorted = data.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      setRepos(sorted)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60) return 'gerade eben'
    if (diff < 3600) return `vor ${Math.floor(diff / 60)}min`
    if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`
    if (diff < 2592000) return `vor ${Math.floor(diff / 86400)}d`
    if (diff < 31536000) return `vor ${Math.floor(diff / 2592000)} Mon.`
    return `vor ${Math.floor(diff / 31536000)}j`
  }

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
        <span className="widget-title">Github</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}></div>
        <select
          value={account}
          onChange={e => setAccount(e.target.value)}
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
          {ACCOUNTS.map(a => <option key={a} value={a}>@{a}</option>)}
        </select>
        <span className="badge badge-api">GitHub</span>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--muted)', padding: '16px 0', textAlign: 'center' }}>
          Lädt Repos...
        </div>
      ) : error ? (
        <div style={{ fontSize: 13, color: '#E24B4A', padding: '8px 0' }}>
          ⚠️ {error}
          <button onClick={() => fetchRepos(account)} style={{
            display: 'block', marginTop: 8,
            padding: '5px 10px', fontSize: 12,
            background: 'var(--bg)', border: '0.5px solid var(--border)',
            borderRadius: 6, cursor: 'pointer', color: 'var(--text)',
          }}>Retry</button>
        </div>
      ) : (
        <div style={{
          overflowY: isMobile ? 'visible' : 'auto',
          flex: 1,
          marginRight: -4,
          paddingRight: 4,
        }}>
          {repos.map((repo, i) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textDecoration: 'none',
                padding: '8px 0',
                borderBottom: i < repos.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Repo name + visibility */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: '#378ADD',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {repo.name}
                    </span>
                    {repo.private && (
                      <span style={{
                        fontSize: 10, padding: '1px 5px',
                        background: 'var(--bg)', border: '0.5px solid var(--border)',
                        borderRadius: 10, color: 'var(--muted)', flexShrink: 0,
                      }}>private</span>
                    )}
                    {repo.fork && (
                      <span style={{
                        fontSize: 10, padding: '1px 5px',
                        background: 'var(--bg)', border: '0.5px solid var(--border)',
                        borderRadius: 10, color: 'var(--muted)', flexShrink: 0,
                      }}>fork</span>
                    )}
                  </div>

                  {/* Description */}
                  {repo.description && (
                    <div style={{
                      fontSize: 11, color: 'var(--muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: 4,
                    }}>
                      {repo.description}
                    </div>
                  )}

                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--muted)' }}>
                    {repo.language && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: LANG_COLORS[repo.language] || '#888',
                          flexShrink: 0,
                        }} />
                        {repo.language}
                      </span>
                    )}
                    {repo.stargazers_count > 0 && (
                      <span>★ {repo.stargazers_count}</span>
                    )}
                    {repo.open_issues_count > 0 && (
                      <span style={{ color: '#E24B4A' }}>⚠ {repo.open_issues_count}</span>
                    )}
                  </div>
                </div>

                {/* Last push */}
                <div style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, textAlign: 'right' }}>
                  {timeAgo(repo.pushed_at)}
                  <div style={{ marginTop: 2 }}>
                    <span style={{
                      fontSize: 10, padding: '1px 5px',
                      background: repo.default_branch === 'main' ? '#E1F5EE' : 'var(--bg)',
                      color: repo.default_branch === 'main' ? '#0F6E56' : 'var(--muted)',
                      borderRadius: 10,
                    }}>
                      {repo.default_branch}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}

          {repos.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
              Keine Repos gefunden
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && !error && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, paddingTop: 6, borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{repos.length} Repos</span>
          <button onClick={() => fetchRepos(account)} style={{
            background: 'none', border: 'none', fontSize: 11,
            color: 'var(--muted)', cursor: 'pointer', padding: 0,
          }}>↻ Aktualisieren</button>
        </div>
      )}
    </div>
  )
}