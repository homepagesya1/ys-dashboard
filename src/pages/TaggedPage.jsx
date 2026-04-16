import GymWidget from '../components/widgets/GymWidget'
import RunsWidget from '../components/widgets/RunsWidget'
import WeatherWidget from '../components/widgets/WeatherWidget'
import GitHubWidget from '../components/widgets/GitHubWidget'
import CloudflareWidget from '../components/widgets/CloudflareWidget'
import DomainsWidget from '../components/widgets/DomainsWidget'
import DevicesWidget from '../components/widgets/DevicesWidget'

export const WIDGET_REGISTRY = {
  gym:        { label: 'Gym Sessions',  component: GymWidget,        tags: ['fitness'] },
  runs:       { label: 'Runs',          component: RunsWidget,       tags: ['fitness'] },
  weather:    { label: 'Wetter Zürich', component: WeatherWidget,    tags: ['general'] },
  github:     { label: 'GitHub Repos',  component: GitHubWidget,     tags: ['tech'] },
  cloudflare: { label: 'Cloudflare',    component: CloudflareWidget, tags: ['tech'] },
  domains:    { label: 'Domains',       component: DomainsWidget,    tags: ['general', 'tech'] },
  devices:    { label: 'Geräte',        component: DevicesWidget,    tags: ['general', 'tech'] },
}

export default function TaggedPage({ tag, title }) {
  const widgets = Object.entries(WIDGET_REGISTRY).filter(([, w]) => w.tags.includes(tag))

  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {widgets.map(([key, { component: Widget }]) => (
          <Widget key={key} />
        ))}
      </div>
    </div>
  )
}