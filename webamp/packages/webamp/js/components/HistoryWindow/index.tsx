import { useEffect, useState } from "react";
import GenWindow from "../GenWindow";
import { WINDOWS, LOAD_STYLE } from "../../constants";
import * as Actions from "../../actionCreators";
import * as Selectors from "../../selectors";
import { useActionCreator, useTypedSelector } from "../../hooks";

import "../../../css/history-window.css";

const { ipcRenderer } = window.require("electron");

interface HistoryEntry {
  id: string;
  title: string;
  artists?: string;
  coverUri?: string;
  durationMs?: number;
  playedAt: number;
}

function formatDuration(ms?: number): string {
  if (!ms) return "";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatPlayedAt(timestamp: number): string {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (date.toDateString() === new Date().toDateString()) {
    return time;
  }
  return `${date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  })} ${time}`;
}

function coverUrl(uri?: string): string | null {
  if (!uri) return null;
  return `https://${uri.replace("%%", "50x50")}`;
}

export default function HistoryWindow() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const loadMediaFile = useActionCreator(Actions.loadMediaFile);
  const trackCount = useTypedSelector(Selectors.getTrackCount);

  useEffect(() => {
    ipcRenderer.invoke("getHistory").then((data: HistoryEntry[] | null) => {
      if (data) setEntries(data);
    });

    const onUpdate = (_event: unknown, data: HistoryEntry[]) => {
      setEntries(data);
      setSelected(null);
    };

    ipcRenderer.on("historyUpdated", onUpdate);
    return () => {
      ipcRenderer.removeListener("historyUpdated", onUpdate);
    };
  }, []);

  // Добавляет трек в конец текущего плейлиста и сразу включает его.
  const playEntry = (entry: HistoryEntry) => {
    loadMediaFile(
      {
        url: entry.id,
        metaData: { artist: entry.artists || "", title: entry.title },
        duration: entry.durationMs ? Math.floor(entry.durationMs / 1000) : undefined,
      },
      LOAD_STYLE.PLAY,
      trackCount
    );
  };

  return (
    <GenWindow
      title="History"
      windowId={WINDOWS.HISTORY}
      domId="history-window"
      resizeId="history-resize-target"
    >
      {() => (
        <div className="history-content">
          {entries.length === 0 ? (
            <div className="history-empty">История пуста</div>
          ) : (
            <ul className="history-list">
              {entries.map((entry, i) => {
                const cover = coverUrl(entry.coverUri);
                return (
                  <li
                    key={`${entry.id}-${entry.playedAt}`}
                    className={i === selected ? "history-item selected" : "history-item"}
                    title="Двойной клик — воспроизвести"
                    onClick={() => setSelected(i)}
                    onDoubleClick={() => playEntry(entry)}
                  >
                    {cover ? (
                      <img className="history-cover" src={cover} alt="" draggable={false} />
                    ) : (
                      <div className="history-cover" />
                    )}
                    <div className="history-text">
                      <div className="history-title">{entry.title}</div>
                      <div className="history-artist">{entry.artists}</div>
                    </div>
                    <div className="history-meta">
                      <div>{formatPlayedAt(entry.playedAt)}</div>
                      <div>{formatDuration(entry.durationMs)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="history-footer">
            <span>{entries.length} тр.</span>
            <button
              type="button"
              className="history-clear-btn"
              disabled={entries.length === 0}
              onClick={() => {
                ipcRenderer.invoke("clearHistory");
              }}
            >
              Очистить
            </button>
          </div>
        </div>
      )}
    </GenWindow>
  );
}
