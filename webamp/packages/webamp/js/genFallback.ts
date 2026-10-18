import { SkinImages } from "./types";

// Многие скины не содержат GEN.BMP, и тогда окна Milkdrop, «О треке» и
// «История» рисуются рамкой базового скина. В этом случае собираем спрайты
// GEN_* из рамки плейлиста (PLEDIT.BMP), которая есть в каждом скине.

type Img = HTMLImageElement;

function loadImage(src: string): Promise<Img | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Один слой итогового спрайта: прямоугольник (sx, sy, w, h) из исходной
// картинки, нарисованный в точке (dx, dy). Если w больше ширины исходника,
// картинка повторяется по горизонтали.
interface Layer {
  img: Img;
  sx: number;
  sy: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
}

function compose(width: number, height: number, layers: Layer[]): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context == null) {
    throw new Error("Failed to get canvas context");
  }
  for (const { img, sx, sy, w, h, dx, dy } of layers) {
    const tileWidth = Math.max(1, img.width - sx);
    for (let x = 0; x < w; x += tileWidth) {
      const cw = Math.min(tileWidth, w - x);
      context.drawImage(img, sx, sy, cw, h, dx + x, dy, cw, h);
    }
  }
  return canvas.toDataURL();
}

export async function withGenFallback(images: SkinImages): Promise<SkinImages> {
  if (images == null || images.GEN_TOP_LEFT || !images.PLAYLIST_TOP_TILE) {
    return images;
  }

  const names = [
    "PLAYLIST_TOP_TILE",
    "PLAYLIST_TOP_TILE_SELECTED",
    "PLAYLIST_TOP_LEFT_CORNER",
    "PLAYLIST_TOP_LEFT_SELECTED",
    "PLAYLIST_TOP_RIGHT_CORNER",
    "PLAYLIST_TOP_RIGHT_CORNER_SELECTED",
    "PLAYLIST_LEFT_TILE",
    "PLAYLIST_RIGHT_TILE",
    "PLAYLIST_BOTTOM_TILE",
    "PLAYLIST_BOTTOM_LEFT_CORNER",
    "PLAYLIST_BOTTOM_RIGHT_CORNER",
  ];
  const loaded = await Promise.all(
    names.map((name) => (images[name] ? loadImage(images[name]) : null))
  );
  const src: { [name: string]: Img } = {};
  for (let i = 0; i < names.length; i++) {
    const img = loaded[i];
    if (img == null) {
      return images;
    }
    src[names[i]] = img;
  }

  const full = (img: Img, w: number, h: number): Layer => ({
    img,
    sx: 0,
    sy: 0,
    w,
    h,
    dx: 0,
    dy: 0,
  });

  // Правый угол заголовка плейлиста содержит кнопки «свернуть» и «закрыть».
  // У окон GEN есть только «закрыть», поэтому левую часть угла закрываем
  // плиткой заголовка.
  const topRight = (corner: Img, tile: Img) =>
    compose(25, 20, [full(corner, 25, 20), full(tile, 15, 20)]);

  // Нижние 14 строк из 38-пиксельной нижней панели плейлиста.
  const bottomY = 38 - 14;
  const bottomTile = (w: number, dx = 0): Layer => ({
    img: src.PLAYLIST_BOTTOM_TILE,
    sx: 0,
    sy: bottomY,
    w,
    h: 14,
    dx,
    dy: 0,
  });

  const generated: SkinImages = {
    GEN_TOP_LEFT: compose(25, 20, [full(src.PLAYLIST_TOP_LEFT_CORNER, 25, 20)]),
    GEN_TOP_LEFT_SELECTED: compose(25, 20, [
      full(src.PLAYLIST_TOP_LEFT_SELECTED, 25, 20),
    ]),
    GEN_TOP_RIGHT: topRight(src.PLAYLIST_TOP_RIGHT_CORNER, src.PLAYLIST_TOP_TILE),
    GEN_TOP_RIGHT_SELECTED: topRight(
      src.PLAYLIST_TOP_RIGHT_CORNER_SELECTED,
      src.PLAYLIST_TOP_TILE_SELECTED
    ),
    GEN_MIDDLE_LEFT: compose(11, 29, [full(src.PLAYLIST_LEFT_TILE, 11, 29)]),
    GEN_MIDDLE_LEFT_BOTTOM: compose(11, 24, [
      full(src.PLAYLIST_LEFT_TILE, 11, 24),
    ]),
    GEN_MIDDLE_RIGHT: compose(8, 29, [
      { img: src.PLAYLIST_RIGHT_TILE, sx: 12, sy: 0, w: 8, h: 29, dx: 0, dy: 0 },
    ]),
    GEN_MIDDLE_RIGHT_BOTTOM: compose(8, 24, [
      { img: src.PLAYLIST_RIGHT_TILE, sx: 12, sy: 0, w: 8, h: 24, dx: 0, dy: 0 },
    ]),
    GEN_BOTTOM_FILL: compose(25, 14, [bottomTile(25)]),
    GEN_BOTTOM_LEFT: compose(125, 14, [
      bottomTile(125),
      {
        img: src.PLAYLIST_BOTTOM_LEFT_CORNER,
        sx: 0,
        sy: bottomY,
        w: 12,
        h: 14,
        dx: 0,
        dy: 0,
      },
    ]),
    GEN_BOTTOM_RIGHT: compose(125, 14, [
      bottomTile(125),
      {
        img: src.PLAYLIST_BOTTOM_RIGHT_CORNER,
        sx: 150 - 20,
        sy: bottomY,
        w: 20,
        h: 14,
        dx: 125 - 20,
        dy: 0,
      },
    ]),
  };

  for (const [name, tileName] of [
    ["GEN_TOP_LEFT_END", "PLAYLIST_TOP_TILE"],
    ["GEN_TOP_CENTER_FILL", "PLAYLIST_TOP_TILE"],
    ["GEN_TOP_RIGHT_END", "PLAYLIST_TOP_TILE"],
    ["GEN_TOP_LEFT_RIGHT_FILL", "PLAYLIST_TOP_TILE"],
    ["GEN_TOP_LEFT_END_SELECTED", "PLAYLIST_TOP_TILE_SELECTED"],
    ["GEN_TOP_CENTER_FILL_SELECTED", "PLAYLIST_TOP_TILE_SELECTED"],
    ["GEN_TOP_RIGHT_END_SELECTED", "PLAYLIST_TOP_TILE_SELECTED"],
    ["GEN_TOP_LEFT_RIGHT_FILL_SELECTED", "PLAYLIST_TOP_TILE_SELECTED"],
  ]) {
    generated[name] = images[tileName];
  }

  if (images.PLAYLIST_CLOSE_SELECTED) {
    generated.GEN_CLOSE_SELECTED = images.PLAYLIST_CLOSE_SELECTED;
  }

  return { ...images, ...generated };
}
