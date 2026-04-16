import { useState, useEffect } from 'react'
import Topbar from './components/Topbar'
import SideMenu from './components/SideMenu'
import Overview from './pages/Overview'
import Fitness from './pages/Fitness'
import General from './pages/General'
import Tech from './pages/Tech'
import './App.css'

const PAGES = {
  overview: { label: 'Overview', component: Overview },
  general:  { label: 'General',  component: General  },
  fitness:  { label: 'Fitness',  component: Fitness  },
  tech:     { label: 'Tech',     component: Tech     },
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  const PageComponent = PAGES[currentPage].component
  const pageLabel = PAGES[currentPage].label

  function navigate(page) {
    setCurrentPage(page)
    setMenuOpen(false)
  }

  return (
    <div className="app">
      <Topbar
        pageLabel={pageLabel}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(o => !o)}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      <SideMenu
        open={menuOpen}
        currentPage={currentPage}
        pages={PAGES}
        onNavigate={navigate}
        onClose={() => setMenuOpen(false)}
      />
      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}
      <main className="content">
        <PageComponent />
      </main>
    </div>
  )
}