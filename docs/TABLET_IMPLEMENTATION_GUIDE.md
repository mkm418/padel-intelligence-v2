# PadelPassport Tablet Implementation Guide

## Overview

This guide provides concrete implementation patterns for optimizing the PadelPassport app for tablet devices (768px-1199px). The current mobile-first design leaves significant unused space on tablets and doesn't leverage the available screen real estate.

**Current Issues:**
- Single-column layouts waste horizontal space
- Full-screen modals feel cramped and disconnected
- Bottom tab bar is less efficient on larger screens
- No hover states for pointer-based interaction
- Cards could show more information

---

## 1. Navigation Pattern: Collapsible Sidebar

### Current: Bottom Tab Bar
```jsx
{/* Current mobile bottom tabs */}
<div className="fixed bottom-0 left-0 right-0 bg-black/95">
  <div className="flex justify-around py-2">
    {tabs.map((tab) => (
      <button key={tab.id} onClick={() => setActiveTab(tab.id)}>
        <span>{tab.icon}</span>
        <span>{tab.label}</span>
      </button>
    ))}
  </div>
</div>
```

### Tablet: Collapsible Sidebar
```jsx
// New Sidebar component
function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }) {
  const tabs = [
    { id: 'courts', icon: '🏟️', label: 'Courts' },
    { id: 'players', icon: '👥', label: 'Players' },
    { id: 'coaches', icon: '🎓', label: 'Coaches' },
    { id: 'tournaments', icon: '🏆', label: 'Events' },
    { id: 'deals', icon: '💰', label: 'Deals' },
  ];

  return (
    <aside className={`
      hidden md:flex flex-col
      fixed left-0 top-0 h-full
      bg-slate-900/95 backdrop-blur-xl
      border-r border-slate-800
      transition-all duration-300 ease-in-out
      z-40
      ${collapsed ? 'w-18' : 'w-70'}
    `}>
      {/* Logo */}
      <div className={`
        border-b border-slate-800
        ${collapsed ? 'py-6 flex justify-center' : 'px-4 py-6'}
      `}>
        <span className="text-2xl">🎾</span>
        {!collapsed && (
          <span className="text-xl font-bold text-white ml-2">PADEL</span>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="
          absolute -right-3 top-8
          w-6 h-6 rounded-full
          bg-slate-700 border border-slate-600
          flex items-center justify-center
          text-xs text-slate-400
          hover:bg-emerald-600 hover:text-white
          shadow-lg cursor-pointer
        "
      >
        {collapsed ? '→' : '←'}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 py-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              ${collapsed 
                ? 'flex items-center justify-center w-12 h-12 rounded-xl mx-auto my-2 text-xl'
                : 'flex items-center gap-3 px-4 py-3 rounded-xl mx-2 my-1 text-base font-medium w-[calc(100%-16px)]'
              }
              transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            <span className={collapsed ? 'text-xl' : 'text-lg'}>{tab.icon}</span>
            {!collapsed && <span>{tab.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// Update main layout
<main className={`
  min-h-screen bg-black
  transition-all duration-300
  pb-20 md:pb-0
  ${sidebarCollapsed ? 'md:ml-18' : 'md:ml-70'}
`}>
  {/* Bottom tabs - hidden on tablet */}
  <div className="md:hidden fixed bottom-0 ...">
    {/* existing bottom tabs */}
  </div>
  
  {/* Sidebar - visible on tablet */}
  <Sidebar 
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    collapsed={sidebarCollapsed}
    setCollapsed={setSidebarCollapsed}
  />
  
  {/* Content */}
  {children}
</main>
```

---

## 2. Card Grid Layouts

### Courts Grid
```jsx
{/* Current: single column list */}
<div className="space-y-2">
  {clubs.map((club) => <CourtCard key={club.id} court={club} />)}
</div>

{/* Tablet: 2-column grid */}
<div className="
  grid grid-cols-1 md:grid-cols-2 
  gap-2 md:gap-4
">
  {clubs.map((club) => <CourtCard key={club.id} court={club} />)}
</div>
```

### Enhanced Court Card (Tablet)
```jsx
function CourtCard({ club }) {
  return (
    <button className="
      w-full text-left
      bg-slate-800 border border-slate-700 rounded-xl
      
      /* Mobile: horizontal layout */
      flex items-center gap-3 p-3
      
      /* Tablet: vertical layout with larger image */
      md:flex-col md:p-4
      
      /* Hover states for tablet/desktop */
      md:hover:bg-slate-700/50 
      md:hover:border-emerald-500/30
      md:hover:shadow-lg
      md:hover:shadow-emerald-500/10
      transition-all duration-200
      
      active:bg-slate-700
    ">
      {/* Image */}
      {club.image ? (
        <img 
          src={club.image} 
          alt="" 
          className="
            w-12 h-12 rounded-lg object-cover
            md:w-full md:h-32 md:rounded-xl md:mb-3
          "
        />
      ) : (
        <div className="
          w-12 h-12 rounded-lg bg-slate-700 
          flex items-center justify-center text-xl
          md:w-full md:h-32 md:rounded-xl md:mb-3 md:text-3xl
        ">
          🎾
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0 md:w-full">
        <div className="text-white font-medium truncate">{club.name}</div>
        <div className="text-slate-500 text-sm">{club.city}</div>
        
        {/* Extra info visible on tablet */}
        <div className="hidden md:flex items-center gap-2 mt-2">
          <span className="text-emerald-400 text-xs">{club.courts} courts</span>
          {club.distance && (
            <span className="text-slate-500 text-xs">{club.distance}km away</span>
          )}
        </div>
      </div>
      
      {/* Arrow - only on mobile */}
      <span className="text-emerald-400 md:hidden">→</span>
    </button>
  );
}
```

### Players Grid
```jsx
{/* 2-column player grid for tablet */}
<div className="
  grid grid-cols-1 md:grid-cols-2 
  gap-2 md:gap-3
">
  {players.map((player) => (
    <PlayerCard key={player.user_id} player={player} />
  ))}
</div>
```

### Enhanced Player Card
```jsx
function PlayerCard({ player }) {
  const tier = getLevelTier(player.level_value);
  
  return (
    <button className="
      w-full bg-slate-800 border border-slate-700 rounded-xl
      flex items-center gap-3 p-3
      md:gap-4 md:p-4
      md:hover:bg-slate-700/50 md:hover:border-emerald-500/30
      transition-all duration-200
      active:bg-slate-700
    ">
      {/* Avatar */}
      <img 
        src={player.picture || defaultAvatar(player)}
        className="
          w-11 h-11 rounded-xl object-cover bg-slate-700
          md:w-14 md:h-14
        "
      />
      
      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-medium truncate">{player.name}</span>
          {player.total_matches >= 100 && (
            <span className="text-emerald-400 text-xs">✓</span>
          )}
        </div>
        <div className="text-slate-500 text-xs truncate">{player.club_name}</div>
        
        {/* Extra tablet info */}
        <div className="hidden md:flex items-center gap-2 mt-1">
          <span className="text-slate-400 text-xs">
            {player.total_matches} matches
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 text-xs">
            {getLastActive(player.match_date)}
          </span>
        </div>
      </div>
      
      {/* Level badge */}
      <div className={`${tier.bg} rounded-lg px-2.5 py-1.5 text-center min-w-[52px] md:min-w-[64px]`}>
        <div className={`text-base font-bold ${tier.color} md:text-lg`}>
          {player.level_value?.toFixed(1) || '—'}
        </div>
        <div className={`hidden md:block text-[10px] ${tier.color}`}>
          {tier.label}
        </div>
      </div>
    </button>
  );
}
```

---

## 3. Modal Behavior

### Current Full-Screen Modal
```jsx
{selectedPlayer && (
  <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
    {/* Full screen content */}
  </div>
)}
```

### Tablet Centered Modal
```jsx
{selectedPlayer && (
  <div className="
    fixed inset-0 z-50
    
    /* Mobile: full screen */
    bg-black overflow-y-auto
    
    /* Tablet: centered overlay */
    md:bg-black/80 md:backdrop-blur-sm
    md:flex md:items-center md:justify-center
    md:p-8
  ">
    {/* Modal Content */}
    <div className="
      /* Mobile: full width */
      min-h-screen
      
      /* Tablet: constrained width */
      md:min-h-0
      md:max-w-2xl md:w-[70%]
      md:max-h-[85vh]
      md:bg-slate-900
      md:rounded-2xl
      md:border md:border-slate-700
      md:shadow-2xl
      md:overflow-hidden
      md:relative
    ">
      {/* Close button - different position on tablet */}
      <button 
        onClick={() => setSelectedPlayer(null)}
        className="
          /* Mobile: text button in header */
          text-slate-400 text-sm
          
          /* Tablet: X button in corner */
          md:absolute md:top-4 md:right-4
          md:w-10 md:h-10 md:rounded-full
          md:bg-slate-800 md:flex md:items-center md:justify-center
          md:hover:bg-slate-700 md:hover:text-white
        "
      >
        <span className="md:hidden">← Back</span>
        <span className="hidden md:block">✕</span>
      </button>
      
      {/* Modal content */}
      <div className="p-4 md:p-6 overflow-y-auto md:max-h-[calc(85vh-60px)]">
        {/* Profile content */}
      </div>
    </div>
  </div>
)}
```

---

## 4. Hero Section Two-Column Layout

```jsx
{/* Hero Section */}
<section className="
  relative px-4 pt-8 pb-6
  md:px-8 md:py-12
  md:grid md:grid-cols-2 md:gap-8 md:items-center
">
  {/* Left Column: Text Content */}
  <div className="
    text-center
    md:text-left md:order-1
  ">
    <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
      <span className="text-3xl">🎾</span>
      <span className="text-white font-black text-xl">PADEL PASSPORT</span>
    </div>

    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
      Find courts.<br/>
      <span className="text-emerald-400">Find players.</span>
    </h1>

    <p className="mt-3 text-base md:text-lg text-slate-400 md:max-w-md">
      Miami's #1 padel directory
    </p>

    {/* CTAs */}
    <div className="flex gap-3 mt-6 justify-center md:justify-start">
      <button className="flex-1 md:flex-none md:px-8 py-4 bg-emerald-500 ...">
        Find Court →
      </button>
      <button className="flex-1 md:flex-none md:px-8 py-4 bg-slate-800 ...">
        Players
      </button>
    </div>
  </div>

  {/* Right Column: Stats (visible on tablet) */}
  <div className="
    mt-6
    md:mt-0 md:order-2
  ">
    {/* Stats Grid */}
    <div className="
      grid grid-cols-3 gap-4
      md:grid-cols-3 md:gap-6
    ">
      <StatCard number="5,658" label="players" />
      <StatCard number="5,534" label="courts" />
      <StatCard number="100%" label="verified" highlight />
    </div>

    {/* Quick chips - horizontal scroll on mobile, wrapped on tablet */}
    <div className="
      flex gap-2 mt-4
      overflow-x-auto -mx-4 px-4
      md:overflow-visible md:mx-0 md:px-0 md:flex-wrap
    ">
      {quickSearches.map((search) => (
        <button key={search} className="flex-shrink-0 md:flex-shrink ...">
          {search}
        </button>
      ))}
    </div>
  </div>
</section>
```

---

## 5. Split View for Map Mode

```jsx
{viewMode === 'map' && (
  <div className="
    /* Mobile: stacked */
    space-y-4
    
    /* Tablet: side-by-side */
    md:grid md:grid-cols-5 md:gap-4 md:space-y-0
  ">
    {/* Map Panel - larger on tablet */}
    <div className="md:col-span-3 md:sticky md:top-20 md:h-[calc(100vh-120px)]">
      <MapView 
        onSelectClub={setSelectedClub} 
        userLocation={userLocation}
        className="h-[450px] md:h-full"
      />
    </div>
    
    {/* List Panel - scrollable */}
    <div className="md:col-span-2 md:h-[calc(100vh-120px)] md:overflow-y-auto">
      <p className="text-slate-400 text-sm mb-3">{clubs.length} clubs</p>
      <div className="space-y-2">
        {clubs.map((club) => (
          <ClubListItem key={club.id} club={club} onClick={() => setSelectedClub(club)} />
        ))}
      </div>
    </div>
  </div>
)}
```

---

## 6. Horizontal Filter Bar (Players Tab)

```jsx
{/* Filter Section */}
<div className="
  /* Mobile: collapsible panel */
  
  /* Tablet: horizontal bar */
  md:sticky md:top-16 md:z-30
  md:bg-slate-900/95 md:backdrop-blur-xl
  md:py-3 md:px-6 md:-mx-6
  md:border-b md:border-slate-800
">
  {/* Mobile Toggle */}
  <button 
    onClick={() => setShowFilters(!showFilters)}
    className="md:hidden ..."
  >
    ⚙️ Filters
  </button>
  
  {/* Filter Controls */}
  <div className={`
    /* Mobile: collapsible */
    ${showFilters ? 'block' : 'hidden'}
    space-y-3 mt-3
    
    /* Tablet: always visible, horizontal */
    md:flex md:items-center md:gap-4 md:flex-wrap
    md:space-y-0 md:mt-0
  `}>
    {/* Search */}
    <input
      type="text"
      value={playerName}
      onChange={(e) => setPlayerName(e.target.value)}
      placeholder="Search name..."
      className="
        w-full md:w-48
        px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
        text-white text-sm
      "
    />
    
    {/* Dropdowns */}
    <select className="w-full md:w-40 ...">
      <option value="">All Clubs</option>
      {/* ... */}
    </select>
    
    <select className="w-full md:w-32 ...">
      <option value="ALL">All Genders</option>
      {/* ... */}
    </select>
    
    {/* Level Pills */}
    <div className="flex gap-1.5 flex-wrap">
      {levelRanges.map((range) => (
        <button 
          key={range.label}
          onClick={() => setLevelRange(range.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium
            ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}
          `}
        >
          {range.label}
        </button>
      ))}
    </div>
    
    {/* Apply Button - hidden on tablet (auto-applies) */}
    <button className="md:hidden w-full ...">
      Apply Filters
    </button>
  </div>
</div>
```

---

## 7. Week Availability Side-by-Side

```jsx
<div className="
  bg-slate-800 border border-slate-700 rounded-xl p-4
">
  <h3 className="text-white font-medium mb-3">Availability</h3>
  
  <div className="
    /* Mobile: stacked */
    
    /* Tablet: side-by-side */
    md:grid md:grid-cols-2 md:gap-6
  ">
    {/* Day Pills */}
    <div className="
      flex gap-2 overflow-x-auto -mx-4 px-4 pb-3
      md:flex-col md:overflow-visible md:mx-0 md:px-0 md:pb-0
    ">
      {weekAvailability.map((day) => (
        <DayPill 
          key={day.date}
          day={day}
          selected={selectedDay === day.date}
          onClick={() => setSelectedDay(day.date)}
          className="
            flex-shrink-0 w-14 py-2
            md:w-full md:flex md:items-center md:justify-between md:px-4 md:py-3
          "
        />
      ))}
    </div>
    
    {/* Time Slots */}
    <div className="
      grid grid-cols-4 gap-2 mt-2
      md:grid-cols-4 lg:grid-cols-6 md:mt-0
    ">
      {selectedDaySlots.slice(0, 12).map((slot, i) => (
        <TimeSlot key={i} slot={slot} clubId={selectedClub.id} date={selectedDay} />
      ))}
    </div>
  </div>
</div>
```

---

## CSS Utility Classes to Add

```css
/* Add to globals.css */

/* Sidebar widths */
.w-18 { width: 4.5rem; }
.w-70 { width: 17.5rem; }
.ml-18 { margin-left: 4.5rem; }
.ml-70 { margin-left: 17.5rem; }

/* Hover states - only for pointer devices */
@media (hover: hover) and (pointer: fine) {
  .hover-card:hover {
    background-color: rgba(51, 65, 85, 0.5);
    border-color: rgba(16, 185, 129, 0.3);
    box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.1);
    transform: translateY(-2px);
  }
}

/* Safe area handling for iPad */
@supports (padding-top: env(safe-area-inset-top)) {
  .safe-top { padding-top: env(safe-area-inset-top); }
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .safe-left { padding-left: env(safe-area-inset-left); }
  .safe-right { padding-right: env(safe-area-inset-right); }
}
```

---

## Testing Checklist

- [ ] Sidebar collapses/expands smoothly
- [ ] Bottom tabs hidden on 768px+
- [ ] Card grids switch to 2 columns at 768px
- [ ] Modals centered with 70% width on tablet
- [ ] Hero section is 2-column layout
- [ ] Map split view works correctly
- [ ] Horizontal filter bar displays properly
- [ ] Hover states work on pointer devices
- [ ] Touch targets remain large enough (44px minimum)
- [ ] No horizontal scrolling on tablet viewport
- [ ] Content doesn't feel cramped or too spacious
