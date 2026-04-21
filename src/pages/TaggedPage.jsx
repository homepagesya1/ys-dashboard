import GymWidget from '../components/widgets/gym'
import RunsWidget from '../components/widgets/runs'
import WeatherWidget from '../components/widgets/weather'
import GitHubWidget from '../components/widgets/github'
import CloudflareWidget from '../components/widgets/cloudflare-pages'
import DomainsWidget from '../components/widgets/domain-status'
import DevicesWidget from '../components/widgets/devices'
import YsWorkoutWidget from '../components/widgets/ys-workout'


export const WIDGET_REGISTRY = {
  gym: { label: 'Gym Sessions', component: GymWidget, tags: ['fitness'] },
  runs: { label: 'Runs', component: RunsWidget, tags: ['fitness'] },
  weather: { label: 'Wetter Zürich', component: WeatherWidget, tags: ['general'] },
  github: { label: 'GitHub Repos', component: GitHubWidget, tags: ['tech'] },
  cloudflare: { label: 'Cloudflare', component: CloudflareWidget, tags: ['tech'] },
  domains: { label: 'Domains', component: DomainsWidget, tags: ['general', 'tech'] },
  devices: { label: 'Geräte', component: DevicesWidget, tags: ['general', 'tech'] },
  ysworkout: { label: 'ys-workout', component: YsWorkoutWidget, tags: ['tech'] },
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