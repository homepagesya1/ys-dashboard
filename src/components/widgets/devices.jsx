import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

const DEVICE_ICONS = {
  iphone:  '📱',
  macbook: '💻',
  windows: '🖥️',
  airpods: '🎧',
  ipad:    '📟',
}

const TYPE_LABELS = {
  iphone:  'iPhone',
  macbook: 'MacBook',
  windows: 'Windows PC',
  airpods: 'AirPods',
  ipad:    'iPad',
}

export default function DevicesWidget() {
  const [devices, setDevices] = useState([])
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
    fetchDevices()
    const interval = setInterval(fetchDevices, 60 * 1000) // alle 60s
    return () => clearInterval(interval)
  }, [])

  async function fetchDevices() {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      setDevices(data)
      setLastUpdated(new Date())
      setError(null)
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
    return `vor ${Math.floor(diff / 86400)}d`
  }

  function batteryColor(pct) {
    if (pct == null) return 'var(--muted)'
    if (pct > 50) return '#639922'
    if (pct > 20) return '#EF9F27'
    return '#E24B4A'
  }

  function parseExtra(extra) {
    if (!extra) return {}
    if (typeof extra === 'string') {
      try { return JSON.parse(extra) } catch { return {} }
    }
    return extra
  }

  function isStale(dateStr) {
    if (!dateStr) return true
    return (Date.now() - new Date(dateStr)) > 60 * 60 * 1000 // älter als 1h = offline
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
        <span className="widget-title">Geräte</span>
        <span className="badge badge-live">live</span>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
          Lädt...
        </div>
      ) : error ? (
        <div style={{ fontSize: 13, color: '#E24B4A' }}>⚠️ {error}</div>
      ) : (
        <div style={{
          overflowY: isMobile ? 'visible' : 'auto',
          flex: 1,
        }}>
          {devices.map((device, i) => {
            const extra = parseExtra(device.extra)
            const stale = isStale(device.updated_at)
            const online = device.online && !stale

            return (
              <div key={device.id} style={{
                padding: '10px 0',
                borderBottom: i < devices.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Icon */}
                  <span style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>
                    {DEVICE_ICONS[device.typ] || '📦'}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + Online Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {device.name}
                      </span>
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                        background: online ? '#EAF3DE' : 'var(--bg)',
                        color: online ? '#3B6D11' : 'var(--muted)',
                      }}>
                        {online ? 'online' : stale ? 'offline' : 'online'}
                      </span>
                    </div>

                    {/* Standort + Zeit */}
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, marginBottom: 6 }}>
                      {device.standort && <span>📍 {device.standort} · </span>}
                      {timeAgo(device.updated_at)}
                    </div>

                    {/* Stats Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Batterie */}
                      {device.batterie != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{
                            width: 28, height: 12,
                            border: `1px solid ${batteryColor(device.batterie)}`,
                            borderRadius: 3, overflow: 'hidden',
                            position: 'relative',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${device.batterie}%`,
                              background: batteryColor(device.batterie),
                              borderRadius: 2,
                              transition: 'width 0.5s',
                            }}/>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: batteryColor(device.batterie) }}>
                            {device.batterie}%
                          </span>
                          {extra.charging && (
                            <span style={{ fontSize: 11 }}>⚡</span>
                          )}
                        </div>
                      )}

                      {/* IP */}
                      {device.ip && (
                        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
                          {device.ip}
                        </span>
                      )}

                      {/* CPU */}
                      {extra.cpu != null && (
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                          CPU {extra.cpu}%
                        </span>
                      )}

                      {/* RAM */}
                      {extra.ram_gb != null && (
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                          RAM {extra.ram_gb} GB
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && !error && (
        <div style={{
          fontSize: 11, color: 'var(--muted)',
          marginTop: 6, paddingTop: 6,
          borderTop: '0.5px solid var(--border)',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{devices.length} Geräte</span>
          <button onClick={fetchDevices} style={{
            background: 'none', border: 'none',
            fontSize: 11, color: 'var(--muted)',
            cursor: 'pointer', padding: 0,
          }}>↻ Aktualisieren</button>
        </div>
      )}
    </div>
  )
}