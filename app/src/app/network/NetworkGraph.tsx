"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";

// react-force-graph-2d: client-only (canvas)
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

// ─── Types ──────────────────────────────────────────────────────────────

interface TopPartner {
  id: string;
  name: string;
  weight: number;
  relationship: string;
}

interface GraphNode {
  id: string;
  name: string;
  level: number | null;
  levelConfidence: number | null;
  matchCount: number;
  totalBookings: number;
  clubs: string[];
  gender: string;
  picture: string | null;
  firstMatch: string;
  lastMatch: string;
  position: string | null;
  isPremium: boolean;
  degree: number;
  topPartners: TopPartner[];
  // W/L
  wins: number;
  losses: number;
  winRate: number | null;
  // Sets/games
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  // Social
  uniqueTeammates: number;
  uniqueOpponents: number;
  // Match types
  competitiveMatches: number;
  friendlyMatches: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
  relationship?: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  value: number;
  level: number | null;
  extra?: string;
}

interface PairEntry {
  source: { id: string; name: string };
  target: { id: string; name: string };
  weight: number;
  relationship: string;
}

interface ClubBreakdown {
  name: string;
  count: number;
}

interface NetworkData {
  nodes: GraphNode[];
  links: GraphLink[];
  meta: {
    totalPlayers: number;
    totalEdges: number;
    filteredPlayers: number;
    filteredEdges: number;
  };
  clubs: string[];
  leaderboard: {
    mostActive: LeaderboardEntry[];
    mostConnected: LeaderboardEntry[];
    bestWinRate: LeaderboardEntry[];
    topPairs: PairEntry[];
    clubBreakdown: ClubBreakdown[];
    levelDistribution: Record<string, number>;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────

const PLAYTOMIC_PROFILE = "https://app.playtomic.io/user";

function levelColor(level: number | null): string {
  if (level == null) return "#555";
  const t = Math.min(level / 6, 1);
  const r = Math.round(255 * t);
  const g = Math.round(255 * (1 - t * 0.6));
  return `rgb(${r},${g},60)`;
}

function nodeSize(matchCount: number): number {
  return Math.max(2, Math.log2(matchCount + 1) * 1.5);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

/** Returns a recency label + color class based on days since last match */
function recencyBadge(lastMatch: string): { label: string; color: string } | null {
  const days = daysBetween(lastMatch, new Date().toISOString());
  if (days <= 7) return { label: "This week", color: "text-green-400" };
  if (days <= 30) return { label: "This month", color: "text-yellow-400" };
  if (days <= 90) return { label: `${Math.round(days / 30)}mo ago`, color: "text-muted" };
  return null;
}

type SidebarTab = "filters" | "leaderboard";
type ViewMode = "graph" | "list";
type SortKey = "name" | "level" | "matchCount" | "winRate" | "wins" | "lastMatch";
type SortDir = "asc" | "desc";

// ─── Component ──────────────────────────────────────────────────────────

export default function NetworkGraph() {
  // Filters
  const [minMatches, setMinMatches] = useState(10);
  const [minWeight, setMinWeight] = useState(3);
  const [club, setClub] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [levelRange, setLevelRange] = useState<[number, number]>([0, 8]);

  // View mode: graph or list
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

  // List sorting
  const [sortKey, setSortKey] = useState<SortKey>("matchCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Sidebar tab
  const [tab, setTab] = useState<SidebarTab>("filters");

  // Data
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected node
  const [selected, setSelected] = useState<GraphNode | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  // ── Fetch data ──────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams({
      minMatches: String(minMatches),
      minWeight: String(minWeight),
      ...(club && { club }),
      ...(search && { search }),
      minLevel: String(levelRange[0]),
      maxLevel: String(levelRange[1]),
    });
    setLoading(true);
    fetch(`/api/network?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [minMatches, minWeight, club, search, levelRange]);

  // Sorted nodes for list view
  const sortedNodes = useMemo(() => {
    if (!data) return [];
    const arr = [...data.nodes];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "level":
          cmp = (a.level ?? -1) - (b.level ?? -1);
          break;
        case "matchCount":
          cmp = a.matchCount - b.matchCount;
          break;
        case "winRate":
          cmp = (a.winRate ?? -1) - (b.winRate ?? -1);
          break;
        case "wins":
          cmp = a.wins - b.wins;
          break;
        case "lastMatch":
          cmp = a.lastMatch.localeCompare(b.lastMatch);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [data, sortKey, sortDir]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Focus mode: click zooms to player's neighborhood ───────────────
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelected(node);
      // Zoom to node with animation
      if (graphRef.current) {
        graphRef.current.centerAt(node.x, node.y, 600);
        graphRef.current.zoom(4, 600);
      }
    },
    [],
  );

  const handleBackgroundClick = useCallback(() => {
    setSelected(null);
    // Reset zoom
    if (graphRef.current) {
      graphRef.current.zoomToFit(600, 40);
    }
  }, []);

  // ── Focus on a player from the leaderboard list ─────────────────────
  const focusPlayer = useCallback(
    (playerId: string) => {
      if (!data) return;
      const node = data.nodes.find((n) => n.id === playerId);
      if (node) {
        setSelected(node as GraphNode);
        if (graphRef.current && node.x != null) {
          graphRef.current.centerAt(node.x, node.y, 600);
          graphRef.current.zoom(4, 600);
        }
      }
    },
    [data],
  );

  // ── Highlight set (selected + neighbors) ────────────────────────────
  const highlightSet = useMemo(() => {
    if (!selected || !data) return new Set<string>();
    const s = new Set<string>([selected.id]);
    for (const link of data.links) {
      const src =
        typeof link.source === "string" ? link.source : link.source.id;
      const tgt =
        typeof link.target === "string" ? link.target : link.target.id;
      if (src === selected.id) s.add(tgt);
      if (tgt === selected.id) s.add(src);
    }
    return s;
  }, [selected, data]);

  // ── Canvas renderers ────────────────────────────────────────────────
  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D) => {
      const size = nodeSize(node.matchCount);
      const isHl = highlightSet.size === 0 || highlightSet.has(node.id);
      const isSelected = selected?.id === node.id;

      ctx.globalAlpha = isHl ? 1 : 0.12;

      // Glow ring for selected node
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 3, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(16,185,129,0.3)";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
      ctx.fillStyle = levelColor(node.level);
      ctx.fill();

      // Labels for bigger nodes or highlighted
      if (
        size > 4 ||
        (highlightSet.size > 0 && highlightSet.has(node.id))
      ) {
        const fontSize = Math.max(2.5, size * 0.7);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(
          node.name.split(" ")[0],
          node.x!,
          node.y! + size + fontSize + 1,
        );
      }

      ctx.globalAlpha = 1;
    },
    [highlightSet, selected],
  );

  const paintLink = useCallback(
    (link: GraphLink, ctx: CanvasRenderingContext2D) => {
      const src = link.source as GraphNode;
      const tgt = link.target as GraphNode;
      const srcId = src.id ?? (link.source as string);
      const tgtId = tgt.id ?? (link.target as string);

      const isHl =
        highlightSet.size === 0 ||
        (highlightSet.has(srcId) && highlightSet.has(tgtId));

      ctx.beginPath();
      ctx.moveTo(src.x!, src.y!);
      ctx.lineTo(tgt.x!, tgt.y!);
      ctx.strokeStyle = isHl
        ? `rgba(16,185,129,${Math.min(0.7, link.weight * 0.06)})`
        : "rgba(255,255,255,0.015)";
      ctx.lineWidth = isHl
        ? Math.min(3, 0.3 + link.weight * 0.2)
        : Math.min(1, link.weight * 0.1);
      ctx.stroke();
    },
    [highlightSet],
  );

  // Sort handler for list view
  const handleSort = useCallback((key: SortKey) => {
    setSortDir((prev) => (sortKey === key && prev === "desc" ? "asc" : "desc"));
    setSortKey(key);
  }, [sortKey]);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-border/50 bg-background/90 px-5 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
          >
            Padel Passport
          </a>
          <span className="text-muted/40">/</span>
          <h1 className="text-sm font-semibold">Player Network</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => setViewMode("graph")}
              className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                viewMode === "graph"
                  ? "bg-accent text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Graph
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                viewMode === "list"
                  ? "bg-accent text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              List
            </button>
          </div>
          {data && (
            <div className="flex items-center gap-5 text-xs text-muted">
              <span>
                <strong className="text-foreground">
                  {data.meta.filteredPlayers.toLocaleString()}
                </strong>{" "}
                players
              </span>
              <span>
                <strong className="text-foreground">
                  {data.meta.filteredEdges.toLocaleString()}
                </strong>{" "}
                edges
              </span>
              <span className="text-muted/40">|</span>
              <span className="text-muted/60">
                {data.meta.totalPlayers.toLocaleString()} total in DB
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-border/50 bg-surface/50">
          {/* Tab switcher */}
          <div className="flex border-b border-border/50">
            {(["filters", "leaderboard"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  tab === t
                    ? "border-b-2 border-accent text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t === "filters" ? "Filters" : "Insights"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {tab === "filters" ? (
              <FiltersPanel
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                club={club}
                setClub={setClub}
                minMatches={minMatches}
                setMinMatches={setMinMatches}
                minWeight={minWeight}
                setMinWeight={setMinWeight}
                levelRange={levelRange}
                setLevelRange={setLevelRange}
                clubs={data?.clubs ?? []}
              />
            ) : (
              <InsightsPanel
                leaderboard={data?.leaderboard ?? null}
                onPlayerClick={(id) => {
                  if (viewMode === "graph") {
                    focusPlayer(id);
                  } else {
                    // In list view, select the player
                    const node = data?.nodes.find((n) => n.id === id);
                    if (node) setSelected(node);
                  }
                }}
              />
            )}
          </div>

          {/* Legend (always visible) */}
          <div className="border-t border-border/50 p-4">
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((l) => (
                <div
                  key={l}
                  className="h-2 flex-1 rounded-sm"
                  style={{ background: levelColor(l) }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-muted">
              <span>Beginner</span>
              <span>Advanced</span>
            </div>
          </div>
        </aside>

        {/* ── Main content area ──────────────────────────────── */}
        <main className="relative flex-1">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <p className="text-sm text-muted">Loading network...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* ── Graph view ──────────────────────────────────────── */}
          {viewMode === "graph" && data && !loading && (
            <>
              <ForceGraph2D
                ref={graphRef}
                graphData={{ nodes: data.nodes, links: data.links }}
                nodeCanvasObject={paintNode}
                linkCanvasObject={paintLink}
                nodePointerAreaPaint={(
                  node: GraphNode,
                  color: string,
                  ctx: CanvasRenderingContext2D,
                ) => {
                  const size = nodeSize(node.matchCount);
                  ctx.beginPath();
                  ctx.arc(node.x!, node.y!, size + 3, 0, 2 * Math.PI);
                  ctx.fillStyle = color;
                  ctx.fill();
                }}
                onNodeClick={handleNodeClick}
                onBackgroundClick={handleBackgroundClick}
                cooldownTicks={150}
                warmupTicks={50}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                backgroundColor="#09090b"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...({} as any)}
              />

              {/* Hint overlay */}
              {!selected && (
                <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-surface/80 px-3 py-2 text-[10px] text-muted backdrop-blur">
                  Click a node to explore &middot; Click background to reset
                  zoom
                </div>
              )}

              {/* Selected player panel (graph view) */}
              {selected && (
                <PlayerPanel
                  player={selected}
                  links={data?.links ?? []}
                  nodes={data?.nodes ?? []}
                  onClose={() => {
                    setSelected(null);
                    if (graphRef.current) graphRef.current.zoomToFit(600, 40);
                  }}
                  onPartnerClick={focusPlayer}
                />
              )}
            </>
          )}

          {/* ── List view ──────────────────────────────────────── */}
          {viewMode === "list" && data && !loading && (
            <div className="flex h-full">
              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-surface border-b border-border/50">
                    <tr>
                      <SortHeader
                        label=""
                        sortKey="name"
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                        className="w-12"
                      />
                      <SortHeader
                        label="Player"
                        sortKey="name"
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                      />
                      <SortHeader
                        label="Level"
                        sortKey="level"
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                        className="w-20 text-center"
                      />
                      <SortHeader
                        label="Matches"
                        sortKey="matchCount"
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                        className="w-20 text-center"
                      />
                      <SortHeader
                        label="Win Rate"
                        sortKey="winRate"
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                        className="w-24 text-center"
                      />
                      <SortHeader
                        label="W-L"
                        sortKey="wins"
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                        className="w-20 text-center"
                      />
                      <SortHeader
                        label="Last Active"
                        sortKey="lastMatch"
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                        className="w-28 text-center"
                      />
                      <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted text-left w-48">
                        Clubs
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedNodes.map((player) => (
                      <tr
                        key={player.id}
                        onClick={() => setSelected(player)}
                        className={`border-b border-border/20 cursor-pointer transition-colors hover:bg-surface/80 ${
                          selected?.id === player.id ? "bg-accent/10" : ""
                        }`}
                      >
                        {/* Photo */}
                        <td className="px-3 py-2">
                          {player.picture ? (
                            <img
                              src={player.picture.replace(
                                "c_limit,w_1280",
                                "c_fill,w_32,h_32",
                              )}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{
                                background: levelColor(player.level),
                                color:
                                  player.level != null && player.level > 3
                                    ? "#fff"
                                    : "#000",
                              }}
                            >
                              {player.name.charAt(0)}
                            </div>
                          )}
                        </td>
                        {/* Name */}
                        <td className="px-3 py-2">
                          <div className="font-medium truncate max-w-[200px]">
                            {player.name}
                          </div>
                          {player.isPremium && (
                            <span className="text-[9px] text-amber-400 font-medium">
                              PRO
                            </span>
                          )}
                        </td>
                        {/* Level */}
                        <td className="px-3 py-2 text-center">
                          {player.level != null ? (
                            <span
                              className="inline-flex h-6 min-w-[40px] items-center justify-center rounded-full px-2 text-[11px] font-bold"
                              style={{
                                background: levelColor(player.level),
                                color:
                                  player.level > 3 ? "#fff" : "#000",
                              }}
                            >
                              {player.level.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        {/* Matches */}
                        <td className="px-3 py-2 text-center font-mono">
                          {player.matchCount}
                        </td>
                        {/* Win Rate */}
                        <td className="px-3 py-2 text-center">
                          {player.winRate != null &&
                          player.wins + player.losses > 0 ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-12 h-1.5 rounded-full overflow-hidden bg-border/30">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${player.winRate * 100}%`,
                                    background:
                                      player.winRate >= 0.5
                                        ? "#22c55e"
                                        : "#ef4444",
                                  }}
                                />
                              </div>
                              <span
                                className={`font-mono text-[10px] font-medium ${
                                  player.winRate >= 0.5
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {Math.round(player.winRate * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        {/* W-L */}
                        <td className="px-3 py-2 text-center font-mono text-muted">
                          {player.wins + player.losses > 0 ? (
                            <>
                              <span className="text-green-400">
                                {player.wins}
                              </span>
                              -
                              <span className="text-red-400">
                                {player.losses}
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        {/* Last active */}
                        <td className="px-3 py-2 text-center">
                          <span className="text-muted">{formatDate(player.lastMatch)}</span>
                          {(() => {
                            const badge = recencyBadge(player.lastMatch);
                            return badge ? (
                              <span className={`block text-[9px] font-medium ${badge.color}`}>
                                {badge.label}
                              </span>
                            ) : null;
                          })()}
                        </td>
                        {/* Clubs */}
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {player.clubs.slice(0, 2).map((c) => (
                              <span
                                key={c}
                                className="rounded-full bg-background border border-border/50 px-1.5 py-0.5 text-[9px] text-muted truncate max-w-[90px]"
                              >
                                {c}
                              </span>
                            ))}
                            {player.clubs.length > 2 && (
                              <span className="text-[9px] text-muted/50">
                                +{player.clubs.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Player detail panel (list view) */}
              {selected && (
                <div className="w-[340px] shrink-0 border-l border-border/50 overflow-y-auto">
                  <PlayerPanel
                    player={selected}
                    links={data?.links ?? []}
                    nodes={data?.nodes ?? []}
                    onClose={() => setSelected(null)}
                    onPartnerClick={(id) => {
                      const node = data?.nodes.find((n) => n.id === id);
                      if (node) setSelected(node);
                    }}
                    inline
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

// ─── Filters Panel ────────────────────────────────────────────────────

function FiltersPanel({
  searchInput,
  setSearchInput,
  club,
  setClub,
  minMatches,
  setMinMatches,
  minWeight,
  setMinWeight,
  levelRange,
  setLevelRange,
  clubs,
}: {
  searchInput: string;
  setSearchInput: (v: string) => void;
  club: string;
  setClub: (v: string) => void;
  minMatches: number;
  setMinMatches: (v: number) => void;
  minWeight: number;
  setMinWeight: (v: number) => void;
  levelRange: [number, number];
  setLevelRange: (v: [number, number]) => void;
  clubs: string[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Label>Search player</Label>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Name..."
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Level range */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label>Level range</Label>
          <span className="font-mono text-xs text-foreground">
            {levelRange[0].toFixed(1)} – {levelRange[1].toFixed(1)}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={levelRange[0]}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setLevelRange([Math.min(v, levelRange[1]), levelRange[1]]);
            }}
            className="flex-1 accent-accent"
          />
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={levelRange[1]}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setLevelRange([levelRange[0], Math.max(v, levelRange[0])]);
            }}
            className="flex-1 accent-accent"
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted mt-0.5">
          <span>0</span>
          <span>8</span>
        </div>
      </div>

      <div>
        <Label>Club</Label>
        <select
          value={club}
          onChange={(e) => setClub(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All clubs</option>
          {clubs.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label>Min matches</Label>
          <span className="font-mono text-xs text-foreground">{minMatches}</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={minMatches}
          onChange={(e) => setMinMatches(parseInt(e.target.value, 10))}
          className="w-full accent-accent"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label>Min shared matches</Label>
          <span className="font-mono text-xs text-foreground">{minWeight}</span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={minWeight}
          onChange={(e) => setMinWeight(parseInt(e.target.value, 10))}
          className="w-full accent-accent"
        />
      </div>

      {/* How-to */}
      <div className="rounded-lg border border-border/50 bg-background/50 p-3 text-[10px] text-muted leading-relaxed">
        <p className="font-semibold text-foreground mb-1">How to use</p>
        <ul className="space-y-0.5 list-disc pl-3">
          <li>Toggle Graph / List view in the header</li>
          <li>Filter by level to find players at your skill</li>
          <li>Click a dot or row to see player details</li>
          <li>Filter by club to see community clusters</li>
          <li>Switch to Insights tab for leaderboards</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Insights Panel ───────────────────────────────────────────────────

function InsightsPanel({
  leaderboard,
  onPlayerClick,
}: {
  leaderboard: NetworkData["leaderboard"] | null;
  onPlayerClick: (id: string) => void;
}) {
  const [section, setSection] = useState<
    "active" | "connected" | "winrate" | "pairs" | "clubs" | "levels"
  >("active");

  if (!leaderboard) return <p className="text-xs text-muted">Loading...</p>;

  return (
    <div className="flex flex-col gap-3">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-1">
        {(
          [
            ["active", "Most Active"],
            ["connected", "Most Connected"],
            ["winrate", "Win Rate"],
            ["pairs", "Top Pairs"],
            ["clubs", "Clubs"],
            ["levels", "Levels"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
              section === key
                ? "bg-accent text-background"
                : "bg-background text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Most active */}
      {section === "active" && (
        <RankedList
          items={leaderboard.mostActive}
          valueLabel="matches"
          onPlayerClick={onPlayerClick}
        />
      )}

      {/* Most connected */}
      {section === "connected" && (
        <RankedList
          items={leaderboard.mostConnected}
          valueLabel="connections"
          onPlayerClick={onPlayerClick}
        />
      )}

      {/* Best win rate */}
      {section === "winrate" && (
        <RankedList
          items={leaderboard.bestWinRate}
          valueLabel="%"
          onPlayerClick={onPlayerClick}
        />
      )}

      {/* Top pairs */}
      {section === "pairs" && (
        <div className="space-y-1">
          {leaderboard.topPairs.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-background p-2 text-xs"
            >
              <span className="w-5 text-right text-muted font-mono text-[10px]">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => onPlayerClick(p.source.id)}
                  className="text-accent hover:underline truncate"
                >
                  {p.source.name}
                </button>
                <span className="text-muted mx-1">
                  {p.relationship === "teammate"
                    ? "+"
                    : p.relationship === "opponent"
                      ? "vs"
                      : "&"}
                </span>
                <button
                  onClick={() => onPlayerClick(p.target.id)}
                  className="text-accent hover:underline truncate"
                >
                  {p.target.name}
                </button>
              </div>
              <span className="text-muted font-mono text-[10px] shrink-0">
                {p.weight}g
                <span
                  className={`ml-1 ${
                    p.relationship === "teammate"
                      ? "text-green-400"
                      : p.relationship === "opponent"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {p.relationship === "teammate"
                    ? "TM"
                    : p.relationship === "opponent"
                      ? "VS"
                      : "MX"}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Club breakdown */}
      {section === "clubs" && (
        <div className="space-y-1">
          {leaderboard.clubBreakdown.map((c, i) => (
            <div
              key={c.name}
              className="flex items-center gap-2 rounded-lg bg-background p-2 text-xs"
            >
              <span className="w-5 text-right text-muted font-mono text-[10px]">
                {i + 1}
              </span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-muted font-mono text-[10px]">
                {c.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Level distribution */}
      {section === "levels" && (
        <div className="space-y-1">
          {Object.entries(leaderboard.levelDistribution)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([bucket, count]) => {
              const maxCount = Math.max(
                ...Object.values(leaderboard.levelDistribution),
              );
              const pct = (count / maxCount) * 100;
              return (
                <div key={bucket} className="flex items-center gap-2 text-xs">
                  <span className="w-14 text-right text-muted font-mono text-[10px]">
                    {bucket}
                  </span>
                  <div className="flex-1 h-4 rounded bg-background overflow-hidden">
                    <div
                      className="h-full rounded bg-accent/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-muted font-mono text-[10px]">
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ─── Ranked leaderboard list ──────────────────────────────────────────

function RankedList({
  items,
  valueLabel,
  onPlayerClick,
}: {
  items: LeaderboardEntry[];
  valueLabel: string;
  onPlayerClick: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      {items.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onPlayerClick(p.id)}
          className="flex w-full items-center gap-2 rounded-lg bg-background p-2 text-xs text-left hover:ring-1 hover:ring-accent/50 transition-all"
        >
          <span className="w-5 text-right text-muted font-mono text-[10px]">
            {i + 1}
          </span>
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: levelColor(p.level) }}
          />
          <span className="flex-1 truncate">{p.name}</span>
          <span className="text-muted font-mono text-[10px] shrink-0">
            {p.value.toLocaleString()} {valueLabel}
            {p.extra && (
              <span className="ml-1 text-muted/60">({p.extra})</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Rich Player Detail Panel ─────────────────────────────────────────

function PlayerPanel({
  player,
  links,
  nodes,
  onClose,
  onPartnerClick,
  inline = false,
}: {
  player: GraphNode;
  links: GraphLink[];
  nodes: GraphNode[];
  onClose: () => void;
  onPartnerClick: (id: string) => void;
  inline?: boolean;
}) {
  // Neighbor links sorted by weight (for this graph view)
  const neighborLinks = useMemo(() => {
    const result: { node: GraphNode; weight: number }[] = [];
    for (const l of links) {
      const s = typeof l.source === "string" ? l.source : l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target.id;
      if (s === player.id) {
        const n = nodes.find((n) => n.id === t);
        if (n) result.push({ node: n, weight: l.weight });
      } else if (t === player.id) {
        const n = nodes.find((n) => n.id === s);
        if (n) result.push({ node: n, weight: l.weight });
      }
    }
    return result.sort((a, b) => b.weight - a.weight);
  }, [links, nodes, player.id]);

  const activeSpan = daysBetween(player.firstMatch, player.lastMatch);

  // Wrapper: inline (list view sidebar) vs floating (graph overlay)
  const wrapperClass = inline
    ? "h-full"
    : "absolute bottom-4 right-4 z-20 w-[340px] max-h-[calc(100vh-120px)] overflow-y-auto rounded-xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl";

  return (
    <div className={wrapperClass}>
      {/* Header */}
      <div className={`sticky top-0 z-10 bg-surface/95 backdrop-blur-xl border-b border-border/50 p-4 pb-3 ${!inline ? "rounded-t-xl" : ""}`}>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 h-6 w-6 flex items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground transition-colors"
        >
          &times;
        </button>

        <div className="flex items-center gap-3">
          {/* Player photo or level badge */}
          {player.picture ? (
            <img
              src={player.picture.replace("c_limit,w_1280", "c_fill,w_48,h_48")}
              alt={player.name}
              className="h-11 w-11 rounded-full object-cover border-2"
              style={{ borderColor: levelColor(player.level) }}
            />
          ) : (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: levelColor(player.level),
                color: player.level != null && player.level > 3 ? "#fff" : "#000",
              }}
            >
              {player.level != null ? player.level.toFixed(1) : "?"}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-bold truncate">{player.name}</h3>
            <div className="flex items-center gap-2">
              {player.level != null && (
                <span
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: levelColor(player.level),
                    color: player.level > 3 ? "#fff" : "#000",
                  }}
                >
                  {player.level.toFixed(2)}
                </span>
              )}
              <a
                href={`${PLAYTOMIC_PROFILE}/${player.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-accent hover:underline"
              >
                Playtomic &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 p-4 pb-2">
        <StatCard label="Matches" value={player.matchCount.toLocaleString()} />
        <StatCard label="Teammates" value={String(player.uniqueTeammates)} />
        <StatCard label="Opponents" value={String(player.uniqueOpponents)} />
        <StatCard
          label="Active span"
          value={activeSpan > 365 ? `${Math.round(activeSpan / 365)}y` : `${activeSpan}d`}
        />
        <StatCard label="Gender" value={player.gender || "—"} />
        <StatCard label="Position" value={player.position || "—"} />
      </div>

      {/* W/L Record */}
      {(player.wins > 0 || player.losses > 0) && (
        <div className="mx-4 mb-2 rounded-lg border border-border/50 bg-background p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              W/L Record
              <span className="font-normal normal-case tracking-normal ml-1 text-muted/60">
                ({player.wins + player.losses} of {player.matchCount} reported)
              </span>
            </span>
            {player.winRate != null && (
              <span
                className={`text-xs font-bold ${
                  player.winRate >= 0.5 ? "text-green-400" : "text-red-400"
                }`}
              >
                {Math.round(player.winRate * 100)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              {/* Win/loss bar */}
              <div className="flex h-2 rounded-full overflow-hidden bg-border/30">
                <div
                  className="bg-green-500 h-full"
                  style={{
                    width: `${(player.wins / (player.wins + player.losses)) * 100}%`,
                  }}
                />
                <div className="bg-red-500 h-full flex-1" />
              </div>
            </div>
            <span className="text-[10px] text-muted font-mono shrink-0">
              {player.wins}W - {player.losses}L
            </span>
          </div>
          {/* Sets and games */}
          {(player.setsWon > 0 || player.setsLost > 0) && (
            <div className="mt-2 flex gap-4 text-[10px] text-muted">
              <span>
                Sets{" "}
                <span className="text-foreground font-medium">
                  {player.setsWon}-{player.setsLost}
                </span>
              </span>
              <span>
                Games{" "}
                <span className="text-foreground font-medium">
                  {player.gamesWon}-{player.gamesLost}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Date range + recency */}
      <div className="px-4 pb-3 text-[10px] text-muted flex items-center gap-2 flex-wrap">
        <span>{formatDate(player.firstMatch)} — {formatDate(player.lastMatch)}</span>
        {(() => {
          const badge = recencyBadge(player.lastMatch);
          return badge ? (
            <span className={`rounded-full bg-background px-1.5 py-0.5 text-[9px] font-medium ${badge.color}`}>
              {badge.label}
            </span>
          ) : null;
        })()}
        {player.competitiveMatches > 0 && (
          <span>
            &middot; {player.competitiveMatches} competitive
          </span>
        )}
      </div>

      {/* Clubs */}
      <div className="px-4 pb-3">
        <SectionLabel>Clubs ({player.clubs.length})</SectionLabel>
        <div className="mt-1 flex flex-wrap gap-1">
          {player.clubs.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Top partners from pre-computed data */}
      {player.topPartners.length > 0 && (
        <div className="px-4 pb-3">
          <SectionLabel>Top Connections (all-time)</SectionLabel>
          <div className="mt-1 space-y-1">
            {player.topPartners.map((tp) => (
              <button
                key={tp.id}
                onClick={() => onPartnerClick(tp.id)}
                className="flex w-full items-center justify-between rounded-lg bg-background p-2 text-xs hover:ring-1 hover:ring-accent/50 transition-all text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[9px] font-bold shrink-0 ${
                      tp.relationship === "teammate"
                        ? "text-green-400"
                        : tp.relationship === "opponent"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {tp.relationship === "teammate"
                      ? "TM"
                      : tp.relationship === "opponent"
                        ? "VS"
                        : "MX"}
                  </span>
                  <span className="truncate text-accent">{tp.name}</span>
                </div>
                <span className="text-muted font-mono text-[10px] shrink-0 ml-2">
                  {tp.weight}g
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* In-graph neighbors (current filter) */}
      {neighborLinks.length > 0 && (
        <div className="px-4 pb-4">
          <SectionLabel>
            Connections in view ({neighborLinks.length})
          </SectionLabel>
          <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
            {neighborLinks.slice(0, 20).map(({ node: n, weight }) => (
              <button
                key={n.id}
                onClick={() => onPartnerClick(n.id)}
                className="flex w-full items-center gap-2 rounded-lg bg-background p-2 text-xs hover:ring-1 hover:ring-accent/50 transition-all text-left"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: levelColor(n.level) }}
                />
                <span className="flex-1 truncate">{n.name}</span>
                <span className="text-muted font-mono text-[10px] shrink-0">
                  Lv {n.level?.toFixed(1) ?? "?"} &middot; {weight}g
                </span>
              </button>
            ))}
            {neighborLinks.length > 20 && (
              <p className="text-center text-[10px] text-muted">
                +{neighborLinks.length - 20} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Playtomic link footer */}
      <div className="border-t border-border/50 p-3 text-center">
        <a
          href={`${PLAYTOMIC_PROFILE}/${player.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
        >
          Open Playtomic Profile &rarr;
        </a>
      </div>
    </div>
  );
}

// ─── Tiny shared components ───────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </p>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background p-2">
      <p className="text-[9px] text-muted uppercase">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

// ─── Table sort header ────────────────────────────────────────────────

function SortHeader({
  label,
  sortKey: key,
  current,
  dir,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = current === key;
  return (
    <th
      className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
      onClick={() => onSort(key)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (
          <span className="text-accent">{dir === "desc" ? "↓" : "↑"}</span>
        )}
      </span>
    </th>
  );
}
