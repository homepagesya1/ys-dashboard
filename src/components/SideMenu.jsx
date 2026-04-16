const ICONS = {
  overview: '◈',
  fitness:  '◉',
  bike:     '◎',
  tech:     '◫',
}

export default function SideMenu({ open, currentPage, pages, onNavigate }) {
  return (
    <nav className={`side-menu ${open ? 'open' : ''}`}>
      <div className="menu-section">Main</div>
      {Object.entries(pages).map(([key, { label }]) => (
        <div
          key={key}
          className={`menu-item ${currentPage === key ? 'active' : ''}`}
          onClick={() => onNavigate(key)}
        >
          <span>{ICONS[key]}</span>
          {label}
        </div>
      ))}
    </nav>
  )
}
