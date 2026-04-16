export default function Topbar({ pageLabel, menuOpen, onMenuToggle, theme, onThemeToggle }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="logo">ys.dashboard</span>
        <span className="page-label">{pageLabel}</span>
      </div>
      <div className="topbar-right">
        <button className="theme-toggle" onClick={onThemeToggle} title="Dark/Light Mode">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}