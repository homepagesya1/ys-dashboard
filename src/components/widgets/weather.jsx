import { useEffect, useState } from 'react'

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY
const CITY = 'Zurich'
const LANG = 'de'

const WEATHER_ICONS = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
}

const ERROR_MESSAGES = {
  401: 'API Key ungültig oder noch nicht aktiv (bis zu 2h nach Erstellung)',
   404: 'Stadt nicht gefunden',
  429: 'Zu viele Anfragen — kurz warten',
  500: 'OpenWeatherMap Server-Fehler',
  503: 'OpenWeatherMap nicht erreichbar',
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [retryIn, setRetryIn] = useState(null)

  useEffect(() => {
    if (!API_KEY) {
      setError('VITE_OPENWEATHER_KEY fehlt in .env')
      setLoading(false)
      return
    }
    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchWeather() {
    setLoading(true)
    setError(null)
    setErrorCode(null)

    try {
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric&lang=${LANG}`
      )
      const current = await currentRes.json()

      if (!currentRes.ok) {
        setErrorCode(currentRes.status)
        setError(ERROR_MESSAGES[currentRes.status] || `Fehler ${currentRes.status}: ${current.message}`)
        setLoading(false)

        // Bei 429 retry nach 60s anzeigen
        if (currentRes.status === 429) {
          setRetryIn(60)
          const timer = setInterval(() => {
            setRetryIn(r => {
              if (r <= 1) { clearInterval(timer); fetchWeather(); return null }
              return r - 1
            })
          }, 1000)
        }
        return
      }

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric&lang=${LANG}&cnt=15`
      )
      const fore = await forecastRes.json()

      setWeather(current)
      if (forecastRes.ok) {
        setForecast(fore.list.filter((_, i) => i % 2 === 0).slice(0, 4))
      }
      setLastUpdated(new Date())

    } catch (e) {
      if (e instanceof TypeError && e.message.includes('fetch')) {
        setError('Keine Internetverbindung')
      } else {
        setError(`Unbekannter Fehler: ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  function icon(code) { return WEATHER_ICONS[code] || '🌡️' }

  function windDir(deg) {
    const dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
    return dirs[Math.round(deg / 45) % 8]
  }

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
        <span className="widget-title">Wetter · Zürich</span>
        <span className="badge badge-live">live</span>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          Wetterdaten werden geladen...
        </div>
      ) : error ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: '#E24B4A', marginBottom: 8 }}>
            ⚠️ {error}
          </div>
          {errorCode === 401 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              → Prüfe ob <code>VITE_OPENWEATHER_KEY</code> in <code>.env</code> gesetzt ist
              <br/>→ Neue Keys brauchen bis zu 2h bis sie aktiv sind
              <br/>→ Server neu starten nach <code>.env</code> Änderung
            </div>
          )}
          {retryIn && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              Retry in {retryIn}s...
            </div>
          )}
          <button
            onClick={fetchWeather}
            style={{
              marginTop: 12, padding: '6px 12px',
              background: 'var(--bg)', border: '0.5px solid var(--border)',
              borderRadius: 8, fontSize: 12, cursor: 'pointer',
              color: 'var(--text)',
            }}
          >
            Nochmal versuchen
          </button>
        </div>
      ) : weather && (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>
                  {Math.round(weather.main.temp)}°
                </span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  gefühlt {Math.round(weather.main.feels_like)}°
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 2, textTransform: 'capitalize' }}>
                {weather.weather[0].description}
              </div>
            </div>
            <span style={{ fontSize: 48, lineHeight: 1 }}>{icon(weather.weather[0].icon)}</span>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12 }}>
            <div>
              <div style={{ color: 'var(--muted)' }}>Luftfeuchte</div>
              <div style={{ fontWeight: 600 }}>{weather.main.humidity}%</div>
            </div>
            <div>
              <div style={{ color: 'var(--muted)' }}>Wind</div>
              <div style={{ fontWeight: 600 }}>{Math.round(weather.wind.speed * 3.6)} km/h {windDir(weather.wind.deg)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--muted)' }}>Min / Max</div>
              <div style={{ fontWeight: 600 }}>{Math.round(weather.main.temp_min)}° / {Math.round(weather.main.temp_max)}°</div>
            </div>
            <div>
              <div style={{ color: 'var(--muted)' }}>Regen</div>
              <div style={{ fontWeight: 600 }}>{weather.rain?.['1h'] ? `${weather.rain['1h']} mm` : '0 mm'}</div>
            </div>
          </div>

          {forecast.length > 0 && (
            <div style={{ display: 'flex', gap: 6, borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
              {forecast.map((f, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 2 }}>
                    {new Date(f.dt * 1000).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: 18, margin: '2px 0' }}>{icon(f.weather[0].icon)}</div>
                  <div style={{ fontWeight: 600 }}>{Math.round(f.main.temp)}°</div>
                </div>
              ))}
            </div>
          )}

          {lastUpdated && (
            <div style={{ position: 'absolute', bottom: 8, left: 16, fontSize: 10, color: 'var(--muted)', opacity: 0.6 }}>
              Aktualisiert {lastUpdated.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </>
      )}
    </div>
  )
}