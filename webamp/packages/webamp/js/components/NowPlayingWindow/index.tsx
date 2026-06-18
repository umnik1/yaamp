import { useEffect, useState, ReactNode } from "react";
import GenWindow from "../GenWindow";
import { WINDOWS } from "../../constants";

import "../../../css/now-playing-window.css";

const { ipcRenderer } = window.require("electron");

interface TrackArtist {
  name: string;
  id?: number | string;
}

interface TrackAlbum {
  title: string;
  type?: string;
  genre?: string;
  year?: number;
  releaseDate?: string;
  labels?: { name: string }[];
  trackCount?: number;
  likesCount?: number;
}

interface TrackMetadata {
  id: string;
  title: string;
  durationMs?: number;
  coverUri?: string;
  artists?: TrackArtist[];
  albums?: TrackAlbum[];
  lyricsAvailable?: boolean;
  lyricsInfo?: {
    hasAvailableSyncLyrics?: boolean;
    hasAvailableTextLyrics?: boolean;
  };
  derivedColors?: {
    average?: string;
    waveText?: string;
    miniPlayer?: string;
    accent?: string;
  };
  genre?: string;
}

interface DerivedColors {
  average?: string;
  waveText?: string;
  miniPlayer?: string;
  accent?: string;
}

function getDerivedColors(track: TrackMetadata | null): DerivedColors | null {
  if (!track) return null;
  if (track.derivedColors?.average) return track.derivedColors;
  const albumColors = track.albums?.[0] as { derivedColors?: DerivedColors } | undefined;
  if (albumColors?.derivedColors?.average) return albumColors.derivedColors;
  return track.derivedColors || albumColors?.derivedColors || null;
}

function parseHex(hex: string): [number, number, number] | null {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b]
    .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function darkenHex(hex: string, amount = 0.45): string {
  const rgb = parseHex(hex);
  if (!rgb) return "#000";
  const factor = 1 - amount;
  return toHex(rgb.map((c) => c * factor) as [number, number, number]);
}

function getTrackTheme(colors: DerivedColors | null) {
  if (!colors?.average) {
    return {
      background: "#000",
      text: "#0f0",
      label: "#0a0",
      accent: "#0a0",
    };
  }

  return {
    background: darkenHex(colors.average),
    text: colors.waveText || "#e0e0e0",
    label: colors.miniPlayer || colors.waveText || "#b0b0b0",
    accent: colors.accent || colors.waveText || "#888",
  };
}

function formatDuration(ms?: number): string {
  if (!ms) return "—";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU");
  } catch {
    return dateStr;
  }
}

function coverUrl(uri?: string): string | null {
  if (!uri) return null;
  return `https://${uri.replace("%%", "200x200")}`;
}

function ActionIcon({
  children,
  label,
  disabled,
  color,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled?: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="now-playing-action-btn"
      title={label}
      aria-label={label}
      disabled={disabled}
      style={{ color, borderColor: color }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TrackActions({
  track,
  theme,
}: {
  track: TrackMetadata | null;
  theme: ReturnType<typeof getTrackTheme>;
}) {
  const artistId = track?.artists?.[0]?.id;
  const disabled = track == null;

  return (
    <div className="now-playing-actions">
      <ActionIcon
        label="Лайк"
        color={theme.accent}
        disabled={disabled}
        onClick={() => {
          ipcRenderer.invoke("setLike");
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </ActionIcon>
      <ActionIcon
        label="Дизлайк"
        color={theme.accent}
        disabled={disabled}
        onClick={() => {
          ipcRenderer.invoke("setDislike");
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"
          />
        </svg>
      </ActionIcon>
      <ActionIcon
        label="Треки исполнителя"
        color={theme.accent}
        disabled={disabled || artistId == null}
        onClick={() => {
          if (artistId != null) {
            ipcRenderer.invoke("setArtist", { id: artistId });
          }
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        </svg>
      </ActionIcon>
      <ActionIcon
        label="Поделиться"
        color={theme.accent}
        disabled={disabled}
        onClick={() => {
          ipcRenderer.invoke("openPlayNow");
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"
          />
        </svg>
      </ActionIcon>
    </div>
  );
}

function TrackInfoContent({
  track,
  theme,
}: {
  track: TrackMetadata | null;
  theme: ReturnType<typeof getTrackTheme>;
}) {
  if (!track) {
    return (
      <div
        className="now-playing-empty"
        style={{ backgroundColor: theme.background, color: theme.label }}
      >
        Нет активного трека
      </div>
    );
  }

  const artists = track.artists?.map((a) => a.name).join(", ") || "—";
  const album = track.albums?.[0];
  const coverSrc = coverUrl(track.coverUri);

  return (
    <div
      className="now-playing-content"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      {coverSrc && (
        <img
          className="now-playing-cover"
          src={coverSrc}
          alt=""
          draggable={false}
          style={{ borderColor: theme.accent }}
        />
      )}
      <TrackActions track={track} theme={theme} />
      <div className="now-playing-details">
        <div className="now-playing-title">{track.title}</div>
        <div className="now-playing-row">
          <span className="now-playing-label" style={{ color: theme.label }}>
            Исполнитель
          </span>
          <span className="now-playing-value">{artists}</span>
        </div>
        {album && (
          <>
            <div className="now-playing-row">
              <span className="now-playing-label" style={{ color: theme.label }}>
                Альбом
              </span>
              <span className="now-playing-value">{album.title}</span>
            </div>
            <div className="now-playing-row">
              <span className="now-playing-label" style={{ color: theme.label }}>
                Тип
              </span>
              <span className="now-playing-value">{album.type || "—"}</span>
            </div>
            <div className="now-playing-row">
              <span className="now-playing-label" style={{ color: theme.label }}>
                Жанр
              </span>
              <span className="now-playing-value">{album.genre || track.genre || "—"}</span>
            </div>
            <div className="now-playing-row">
              <span className="now-playing-label" style={{ color: theme.label }}>
                Год
              </span>
              <span className="now-playing-value">{album.year || "—"}</span>
            </div>
            <div className="now-playing-row">
              <span className="now-playing-label" style={{ color: theme.label }}>
                Релиз
              </span>
              <span className="now-playing-value">{formatDate(album.releaseDate)}</span>
            </div>
            {album.labels?.length ? (
              <div className="now-playing-row">
                <span className="now-playing-label" style={{ color: theme.label }}>
                  Лейбл
                </span>
                <span className="now-playing-value">
                  {album.labels.map((l) => l.name).join(", ")}
                </span>
              </div>
            ) : null}
          </>
        )}
        <div className="now-playing-row">
          <span className="now-playing-label" style={{ color: theme.label }}>
            Длительность
          </span>
          <span className="now-playing-value">{formatDuration(track.durationMs)}</span>
        </div>
      </div>
    </div>
  );
}

export default function NowPlayingWindow() {
  const [track, setTrack] = useState<TrackMetadata | null>(null);
  const theme = getTrackTheme(getDerivedColors(track));

  useEffect(() => {
    ipcRenderer.invoke("getCurrentTrackMetadata").then((data: TrackMetadata | null) => {
      if (data) setTrack(data);
    });

    const onMetadata = (_event: unknown, data: TrackMetadata) => {
      setTrack(data);
    };

    ipcRenderer.on("trackMetadata", onMetadata);
    return () => {
      ipcRenderer.removeListener("trackMetadata", onMetadata);
    };
  }, []);

  useEffect(() => {
    const center = document.querySelector("#now-playing-window .gen-middle-center");
    if (center instanceof HTMLElement) {
      center.style.backgroundColor = theme.background;
    }
  }, [theme.background]);

  return (
    <GenWindow
      title="О треке"
      plainTitle
      windowId={WINDOWS.NOW_PLAYING}
      domId="now-playing-window"
      resizeId="now-playing-resize-target"
    >
      {() => <TrackInfoContent track={track} theme={theme} />}
    </GenWindow>
  );
}
