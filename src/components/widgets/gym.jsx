import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

const GYM_TYPEN = ['Push', 'Pull', 'Legs', 'Core', 'Cardio']
const COLORS = ['#1D9E75', '#378ADD', '#EF9F27', '#E24B4A', '#7F77DD', '#D4537E', '#5DCAA5', '#F0997B']

export default function GymWidget({ onRemove }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [datum, setDatum] = useState('')
  const [dauer, setDauer] = useState('')
  const [typ, setTyp] = useState('')
  const [customTyp, setCustomTyp] = useState('')

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_logs')
      .select('*')
      .order('datum', { ascending: false })
      .limit(50)
    if (!error) setLogs(data)
    setLoading(false)
  }

  async function save() {
    const finalTyp = typ === '__custom' ? customTyp : typ
    if (!finalTyp) return
    setSaving(true)
    const { error } = await supabase.from('gym_logs').insert({
      datum: datum || new Date().toISOString().slice(0, 10),
      zeit: dauer ? parseInt(dauer) : null,
      typ: finalTyp,
    })
    if (!error) {
      setTyp(''); setCustomTyp(''); setDauer(''); setDatum('')
      setOverlayOpen(false)
      await fetchLogs()
    }
    setSaving(false)
  }

  // Donut chart
  const counts = {}
  logs.forEach(l => { counts[l.typ] = (counts[l.typ] || 0) + 1 })
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const total = logs.length
  const cx = 70, cy = 70, r = 52, inner = 32

  function buildSegments() {
    if (total === 0) return []
    let angle = -Math.PI / 2
    return entries.map(([label, count], i) => {
      const slice = (count / total) * Math.PI * 2
      const x1 = cx + r * Math.cos(angle)
      const y1 = cy + r * Math.sin(angle)
      angle += slice
      const x2 = cx + r * Math.cos(angle)
      const y2 = cy + r * Math.sin(angle)
      const large = slice > Math.PI ? 1 : 0
      return {
        label, count,
        color: COLORS[i % COLORS.length],
        d: `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`
      }
    })
  }

  const segments = buildSegments()

  return (
    <div style={{
      width: 350, height: 300,
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 12, padding: 16,
      position: 'relative', overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div className="widget-header">
        <span className="widget-title">Gym</span>
        <div className="widget-header-right">
          <span className="badge badge-manual">manuell</span>
          {onRemove && <button className="widget-remove" onClick={onRemove}>×</button>}
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Lädt...</div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', height: 210 }}>
          {/* Donut */}
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
            {total === 0 ? (
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="20"/>
            ) : segments.map((s, i) => (
              <path key={i} d={s.d} fill={s.color}/>
            ))}
            <circle cx={cx} cy={cy} r={inner} fill="var(--surface)"/>
            <text x={cx} y={cy - 8} textAnchor="middle"
              style={{ fontSize: 22, fontWeight: 700, fill: 'var(--text)', fontFamily: 'system-ui' }}>
              {total}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle"
              style={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'system-ui' }}>
              sessions
            </text>
          </svg>

          {/* Legend */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
            {entries.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Noch keine Sessions</div>
            ) : entries.slice(0, 6).map(([label, count], i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }}/>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                  {label}
                </span>
                <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>{count}×</span>
              </div>
            ))}
            {logs[0] && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                Letzte: {new Date(logs[0].datum).toLocaleDateString('de-CH')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-up Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--surface)',
        borderRadius: 12,
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
        transform: overlayOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Session loggen</span>
          <button onClick={() => setOverlayOpen(false)}
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div className="input-row">
          <input className="mini-input" type="date" value={datum} onChange={e => setDatum(e.target.value)} />
          <input className="mini-input" type="number" placeholder="Minuten" value={dauer} onChange={e => setDauer(e.target.value)} />
        </div>
        <select className="mini-input" value={typ} onChange={e => setTyp(e.target.value)} style={{ cursor: 'pointer' }}>
          <option value="">Typ wählen...</option>
          {GYM_TYPEN.map(t => <option key={t} value={t}>{t}</option>)}
          <option value="__custom">Anderes...</option>
        </select>
        {typ === '__custom' && (
          <input className="mini-input" type="text" placeholder="Eigener Typ"
            value={customTyp} onChange={e => setCustomTyp(e.target.value)} autoFocus />
        )}
        <button className="mini-btn" onClick={save}
          disabled={saving || !typ || (typ === '__custom' && !customTyp)}>
          {saving ? '...' : 'Session loggen'}
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