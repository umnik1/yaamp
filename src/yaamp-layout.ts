type SavedWindow = {
  x?: number;
  y?: number;
  size?: [number, number];
  visible?: boolean;
};

type SavedWindows = {
  mainWindow?: SavedWindow;
  playlistWindow?: SavedWindow;
  equalizerWindow?: SavedWindow;
  milkdropWindow?: SavedWindow;
  nowPlayingWindow?: SavedWindow;
};

type WindowLayoutEntry = {
  position: { x: number; y: number };
  size?: [number, number] | null;
};

type WindowLayout = Record<string, WindowLayoutEntry>;

const WINDOW_MAP: [keyof SavedWindows, string][] = [
  ['mainWindow', 'main'],
  ['playlistWindow', 'playlist'],
  ['equalizerWindow', 'equalizer'],
  ['milkdropWindow', 'milkdrop'],
  ['nowPlayingWindow', 'nowplaying'],
];

const VISIBILITY_DEFAULTS = [
  ['main', 'mainWindow', true],
  ['playlist', 'playlistWindow', true],
  ['equalizer', 'equalizerWindow', true],
  ['milkdrop', 'milkdropWindow', true],
  ['nowplaying', 'nowPlayingWindow', false],
] as const;

const RESIZABLE_WINDOWS = new Set(['playlist', 'milkdrop', 'nowplaying']);

export const DEFAULT_WINDOW_LAYOUT: WindowLayout = {
  main: { position: { x: 0, y: 12 } },
  playlist: { position: { x: 0, y: 244 }, size: [0, 0] },
  equalizer: { position: { x: 0, y: 128 } },
  milkdrop: { position: { x: 275, y: 12 }, size: [7, 8] },
  nowplaying: { position: { x: 275, y: 128 }, size: [4, 6] },
};

function withResizableSize(windowId: string, size?: [number, number]): WindowLayoutEntry {
  const entry = DEFAULT_WINDOW_LAYOUT[windowId];
  const layoutEntry: WindowLayoutEntry = {
    position: entry?.position ?? { x: 0, y: 0 },
  };

  if (RESIZABLE_WINDOWS.has(windowId) && size != null) {
    layoutEntry.size = size;
  }

  return layoutEntry;
}

export function buildInitialWindowLayout(windows?: SavedWindows): WindowLayout {
  if (!windows) {
    return DEFAULT_WINDOW_LAYOUT;
  }

  const layout: WindowLayout = { ...DEFAULT_WINDOW_LAYOUT };

  for (const [settingsKey, windowId] of WINDOW_MAP) {
    const win = windows[settingsKey];
    if (!win) continue;

    layout[windowId] = withResizableSize(
      windowId,
      win.size ?? layout[windowId]?.size ?? undefined
    );
    layout[windowId].position = {
      x: toFiniteNumber(win.x, 0),
      y: toFiniteNumber(win.y, 0),
    };
  }

  const defaultVisibility = Object.fromEntries(
    VISIBILITY_DEFAULTS.map(([windowId, settingsKey, defaultVisible]) => [
      windowId,
      getSavedWindowVisibility(windows, settingsKey, defaultVisible),
    ])
  );
  const { positions } = normalizeWindowPositions(
    Object.fromEntries(Object.entries(layout).map(([windowId, win]) => [windowId, win.position])),
    (windowId) => !!defaultVisibility[windowId]
  );
  for (const [windowId, position] of Object.entries(positions)) {
    layout[windowId] = { ...layout[windowId], position };
  }

  return layout;
}

type Point = { x: number; y: number };

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

// Убирает отрицательные координаты окон: видимые сдвигаются вместе, скрытые
// прижимаются к нулю. Возвращает сдвиг видимых окон.
export function normalizeWindowPositions(
  positions: Record<string, Point>,
  isOpen: (windowId: string) => boolean
): { positions: Record<string, Point>; shift: Point } {
  const visible = Object.entries(positions).filter(([windowId]) => isOpen(windowId));
  const minX = Math.min(0, ...visible.map(([, p]) => p.x));
  const minY = Math.min(0, ...visible.map(([, p]) => p.y));
  const shift = { x: -minX, y: -minY };

  const normalized: Record<string, Point> = {};
  for (const [windowId, p] of Object.entries(positions)) {
    normalized[windowId] = isOpen(windowId)
      ? { x: p.x + shift.x, y: p.y + shift.y }
      : { x: Math.max(0, p.x), y: Math.max(0, p.y) };
  }

  return { positions: normalized, shift };
}

export function getSavedWindowVisibility(
  windows: SavedWindows | undefined,
  settingsKey: keyof SavedWindows,
  defaultVisible: boolean
): boolean {
  const visible = windows?.[settingsKey]?.visible;
  return visible !== undefined ? !!visible : defaultVisible;
}

export function applySavedWindows(store: any, windows?: SavedWindows) {
  const layout = buildInitialWindowLayout(windows);

  for (const [windowId, win] of Object.entries(layout)) {
    if (RESIZABLE_WINDOWS.has(windowId) && win.size != null) {
      store.dispatch({
        type: 'WINDOW_SIZE_CHANGED',
        windowId,
        size: win.size,
      });
    }
  }

  store.dispatch({
    type: 'UPDATE_WINDOW_POSITIONS',
    positions: Object.fromEntries(
      Object.entries(layout).map(([windowId, win]) => [windowId, win.position])
    ),
    absolute: false,
  });

  for (const [windowId, settingsKey, defaultVisible] of VISIBILITY_DEFAULTS) {
    const shouldBeOpen = getSavedWindowVisibility(windows, settingsKey, defaultVisible);
    const isOpen = store.getState().windows.genWindows[windowId]?.open;
    if (isOpen !== shouldBeOpen) {
      store.dispatch({ type: 'TOGGLE_WINDOW', windowId });
    }
  }
}
