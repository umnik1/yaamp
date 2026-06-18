import * as Selectors from "./selectors";
import { closeWindow, toggleWindow } from "./actionCreators/windows";
import { Thunk, WindowId } from "./types";

const { ipcRenderer } = window.require("electron");

export function saveWindowState(
  windowId: WindowId,
  state: { visible: boolean; x?: number; y?: number; size?: [number, number] }
) {
  ipcRenderer.invoke("saveWindowState", { windowId, ...state });
}

export function toggleWindowAndSave(windowId: WindowId): Thunk {
  return (dispatch, getState) => {
    const state = getState();
    const wasOpen = Selectors.getWindowOpen(state)(windowId);
    const window = state.windows.genWindows[windowId];
    dispatch(toggleWindow(windowId));
    saveWindowState(windowId, {
      visible: !wasOpen,
      x: window?.position?.x,
      y: window?.position?.y,
      size: window?.size,
    });
  };
}

export function closeWindowAndSave(windowId: WindowId): Thunk {
  return (dispatch, getState) => {
    const state = getState();
    const window = state.windows.genWindows[windowId];
    dispatch(closeWindow(windowId));
    saveWindowState(windowId, {
      visible: false,
      x: window?.position?.x,
      y: window?.position?.y,
      size: window?.size,
    });
  };
}
