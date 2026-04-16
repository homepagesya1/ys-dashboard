import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { WIDGET_REGISTRY } from './TaggedPage'

export default function Overview() {
  const [activeWidgets, setActiveWidgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const saveTimeout = useRef(null)

  useEffect(() => { fetchLayout() }, [])

  async function fetchLayout() {
    const { data, error } = await supabase
      .from('dashboard_layout')
      .select('widgets')
      .eq('id', 1)
      .single()
    if (!error && data) setActiveWidgets(data.widgets || [])
    setLoading(false)
  }

  async function saveLayout(widgets) {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      await supabase
        .from('dashboard_layout')
        .update({ widgets, updated_at: new Date().toISOString() })
        .eq('id', 1)
    }, 500)
  }

  function addWidget(key) {
    if (activeWidgets.includes(key)) return
    const updated = [...activeWidgets, key]
    setActiveWidgets(updated)
    saveLayout(updated)
    setPickerOpen(false)
  }

  function removeWidget(key) {
    const updated = activeWidgets.filter(w => w !== key)
    setActiveWidgets(updated)
    saveLayout(updated)
  }

  function onDragStart(i) { setDragIndex(i) }

  function onDragEnter(i) {
    if (i === dragIndex) return
    const updated = [...activeWidgets]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(i, 0, moved)
    setActiveWidgets(updated)
    setDragIndex(i)
  }

  function onDragEnd() {
    setDragIndex(null)
    saveLayout(activeWidgets)
  }

  const availableToAdd = Object.keys(WIDGET_REGISTRY).filter(k => !activeWidgets.includes(k))

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)', fontSize: 13 }}>Lädt...</div>

  return (
    <div style={{ position: 'relative', minHeight: '80vh' }}>
      <h1 className="page-title">Overview</h1>

      {activeWidgets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 }}>
          Noch keine Widgets — klick auf <strong>+</strong> um welche hinzuzufügen.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {activeWidgets.map((key, i) => {
            const Widget = WIDGET_REGISTRY[key]?.component
            if (!Widget) return null
            return (
              <div
                key={key}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
                onDragOver={e => e.preventDefault()}
                style={{ opacity: dragIndex === i ? 0.4 : 1, transition: 'opacity 0.15s', cursor: 'grab' }}
              >
                <Widget onRemove={() => removeWidget(key)} />
              </div>
            )
          })}
        </div>
      )}

      {pickerOpen && (
        <>
          <div onClick={() => setPickerOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
          <div style={{
            position: 'fixed', bottom: 80, right: 24, zIndex: 201,
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 12, padding: 8, minWidth: 210,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', padding: '6px 10px 4px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Widget hinzufügen
            </div>
            {availableToAdd.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 10px' }}>Alle Widgets sind aktiv.</div>
            ) : availableToAdd.map(key => (
              <div key={key} onClick={() => addWidget(key)}
                style={{ padding: '9px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>+</span>
                {WIDGET_REGISTRY[key].label}
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={() => setPickerOpen(o => !o)} style={{
        position: 'fixed', bottom: 24, right: 24,
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--accent)', color: '#fff',
        border: 'none', fontSize: 24, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(29,158,117,0.35)',
        transition: 'transform 0.2s',
        transform: pickerOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        zIndex: 202,
      }}>+</button>
    </div>
  )
}