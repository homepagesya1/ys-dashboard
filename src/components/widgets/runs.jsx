import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function RunsWidget({ onRemove }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [datum, setDatum] = useState('')
  const [km, setKm] = useState('')
  const [minuten, setMinuten] = useState('')

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .order('datum', { ascending: false })
      .limit(5)
    if (!error) setLogs(data)
    setLoading(false)
  }

  async function save() {
    if (!km || !minuten) return
    setSaving(true)
    const { error } = await supabase.from('runs').insert({
      datum: datum || new Date().toISOString().slice(0, 10),
      km: parseFloat(km),
      zeit: parseFloat(minuten),
    })
    if (!error) {
      setKm(''); setMinuten(''); setDatum('')
      setOverlayOpen(false)
      await fetchLogs()
    }
    setSaving(false)
  }

  function formatZeit(z) {
    if (z == null) return '—'
    const total = parseFloat(z)
    const h = Math.floor(total / 60)
    const m = Math.round((total % 60) * 10) / 10
    if (h > 0) return `${h}h${m > 0 ? ' ' + m + 'min' : ''}`
    return `${total}min`
  }

  const chartData = [...logs].reverse()
  const W = 318, H = 120
  const pad = { top: 10, right: 10, bottom: 24, left: 28 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom
  const maxKm = chartData.length > 0 ? Math.max(...chartData.map(l => parseFloat(l.km))) : 10
  const yMax = Math.ceil(maxKm / 5) * 5 || 10

  function xPos(i) {
    if (chartData.length === 1) return pad.left + innerW / 2
    return pad.left + (i / (chartData.length - 1)) * innerW
  }
  function yPos(k) {
    return pad.top + innerH - (parseFloat(k) / yMax) * innerH
  }

  const points = chartData.map((l, i) => `${xPos(i).toFixed(1)},${yPos(l.km).toFixed(1)}`).join(' ')
  const totalKm = logs.reduce((s, l) => s + parseFloat(l.km), 0).toFixed(1)

  return (
    <div style={{
      width: 350, height: 300,
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 12, padding: 16,
      position: 'relative', overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div className="widget-header">
        <span className="widget-title">Runs</span>
        <div className="widget-header-right">
          <span className="badge badge-manual">manuell</span>
          {onRemove && <button className="widget-remove" onClick={onRemove}>×</button>}
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Lädt...</div>
      ) : (
        <>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
            {logs[0] ? parseFloat(logs[0].km).toFixed(1) : '—'}
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>km letzter Run</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, marginBottom: 10 }}>
            Total: {totalKm} km · {logs.length} Runs
          </div>

          <svg width={W} height={H} style={{ overflow: 'visible' }}>
            {[0, 0.5, 1].map(t => {
              const y = pad.top + innerH - t * innerH
              return (
                <g key={t}>
                  <line x1={pad.left} y1={y} x2={pad.left + innerW} y2={y}
                    stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3"/>
                  <text x={pad.left - 4} y={y + 4} textAnchor="end"
                    style={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'system-ui' }}>
                    {(t * yMax).toFixed(0)}
                  </text>
                </g>
              )
            })}
            {chartData.length > 1 && (
              <polygon
                points={`${pad.left},${pad.top + innerH} ${points} ${xPos(chartData.length - 1)},${pad.top + innerH}`}
                fill="#1D9E75" opacity="0.08"/>
            )}
            {chartData.length > 1 && (
              <polyline points={points} fill="none" stroke="#1D9E75" strokeWidth="2"
                strokeLinejoin="round" strokeLinecap="round"/>
            )}
            {chartData.map((l, i) => (
              <g key={l.id}>
                <circle cx={xPos(i)} cy={yPos(l.km)} r="3.5" fill="#1D9E75"/>
                <text x={xPos(i)} y={H - 4} textAnchor="middle"
                  style={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'system-ui' }}>
                  {new Date(l.datum).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}
                </text>
                <title>{l.km} km · {formatZeit(l.zeit)}</title>
              </g>
            ))}
          </svg>
        </>
      )}

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--surface)',
        borderRadius: 12, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
        transform: overlayOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Run loggen</span>
          <button onClick={() => setOverlayOpen(false)}
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>
            ×
          </button>
        </div>
        <input className="mini-input" type="date" value={datum} onChange={e => setDatum(e.target.value)} />
        <div className="input-row">
          <input className="mini-input" type="number" step="0.1" placeholder="km z.B. 5.2"
            value={km} onChange={e => setKm(e.target.value)} />
          <input className="mini-input" type="number" step="0.5" placeholder="Min. z.B. 28 oder 90"
            value={minuten} onChange={e => setMinuten(e.target.value)} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
          Zeit in Minuten · 1.5h = 90min
        </div>
        <button className="mini-btn" onClick={save} disabled={saving || !km || !minuten}>
          {saving ? '...' : 'Run loggen'}
        </button>
      </div>

      {/* + FAB */}
      <button onClick={() => setOverlayOpen(o => !o)} style={{
        position: 'absolute', bottom: 12, right: 12,
        width: 32, height: 32, borderRadius: '50%',
        background: 'var(--accent)', color: '#fff',
        border: 'none', fontSize: 20, lineHeight: 1,
        cursor: 'pointer', zIndex: 11,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(29,158,117,0.4)',
        transition: 'transform 0.2s',
        transform: overlayOpen ? 'rotate(45deg)' : 'rotate(0deg)',
      }}>+</button>
    </div>
  )
}