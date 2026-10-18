type SavedWindow = {
  x?: number;
  y?: number;
  size?: [number, number];
  visible?: boolean;
};

import WINDOW_DEFAULTS from './node/window-defaults.json';

type SavedWindows = Record<string, SavedWindow | undefined>;

type WindowLayoutEntry = {
  position: { x: number; y: number };
  size?: [number, number] | null;
};

type WindowLayout = Record<string, WindowLayoutEntry>;

type WindowDefaults = {
  settingsKey: string;
  x: number;
  y: number;
  size?: [number, number];
  visible: boolean;
};

const DEFAULTS = WINDOW_DEFAULTS as unknown as Record<string, WindowDefaults>;

const WINDOW_MAP: [string, string][] = Object.entries(DEFAULTS).map(
  ([windowId, win]) => [win.settingsKey, windowId]
);

const VISIBILITY_DEFAULTS: [string, string, boolean][] = Object.entries(DEFAULTS).map(
  ([windowId, win]) => [windowId, win.settingsKey, win.visible]
);

const RESIZABLE_WINDOWS = new Set(
  Object.keys(DEFAULTS).filter((windowId) => DEFAULTS[windowId].size != null)
);

export const DEFAULT_WINDOW_LAYOUT: WindowLayout = Object.fromEntries(
  Object.entries(DEFAULTS).map(([windowId, win]) => [
    windowId,
    win.size
      ? { position: { x: win.x, y: win.y }, size: win.size }
      : { position: { x: win.x, y: win.y } },
  ])
);

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
