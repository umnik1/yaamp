import { ReactNode, useCallback, useEffect, useState } from "react";

import * as SnapUtils from "../snapUtils";
import * as Selectors from "../selectors";
import * as Actions from "../actionCreators";
import { WindowInfo, WindowId, Box, Point } from "../types";
import { useTypedSelector, useActionCreator } from "../hooks";
const { ipcRenderer } = window.require('electron');

const abuts = (a: Box, b: Box) => {
  // TODO: This is kinda a hack. They should really be touching, not just within snapping distance.
  // Also, overlapping should not count.
  const wouldMoveTo = SnapUtils.snap(a, b);
  return wouldMoveTo.x !== undefined || wouldMoveTo.y !== undefined;
};

let posOnStart = false;

interface Props {
  windows: { [windowId: string]: ReactNode };
}

type DraggingState = {
  moving: WindowInfo[];
  stationary: WindowInfo[];
  boundingBox: Box;
  mouseStart: Point;
};

function useHandleMouseDown(propsWindows: {
  [windowId: string]: ReactNode;
}): (key: WindowId, e: React.MouseEvent<HTMLDivElement>) => void {
  const windowsInfo = useTypedSelector(Selectors.getWindowsInfo);
  const getOpen = useTypedSelector(Selectors.getWindowOpen);
  const getWindowHidden = useTypedSelector(Selectors.getWindowHidden);
  const browserWindowSize = useTypedSelector(Selectors.getBrowserWindowSize);
  const updateWindowPositions = useActionCreator(Actions.updateWindowPositions);

  const [draggingState, setDraggingState] = useState<DraggingState | null>(
    null
  );

  // When the mouse is down, attach a listener to track mouse move events.
  useEffect(() => {
    if (draggingState == null) {
      return;
    }
    const { boundingBox, moving, stationary, mouseStart } = draggingState;
    const handleMouseMove = (ee: MouseEvent) => {
      const proposedDiff = {
        x: ee.clientX - mouseStart.x,
        y: ee.clientY - mouseStart.y,
      };

      const proposedWindows = moving.map((node) => ({
        ...node,
        ...SnapUtils.applyDiff(node, proposedDiff),
      }));

      const proposedBox = {
        ...boundingBox,
        ...SnapUtils.applyDiff(boundingBox, proposedDiff),
      };

      const snapDiff = SnapUtils.snapDiffManyToMany(
        proposedWindows,
        stationary
      );

      const withinDiff = SnapUtils.snapWithinDiff(
        proposedBox,
        browserWindowSize
      );

      const finalDiff = SnapUtils.applyMultipleDiffs(
        proposedDiff,
        snapDiff,
        withinDiff
      );

      const windowPositionDiff: { [windowId: string]: Point } = {};
      moving.forEach((w) => {
        windowPositionDiff[w.key] = SnapUtils.applyDiff(w, finalDiff);
      });

      updateWindowPositions(windowPositionDiff, false);
    };

    function handleMouseUp() {
      setDraggingState(null);
    }

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [browserWindowSize, draggingState, updateWindowPositions]);

  // Mouse down handler
  return useCallback(
    (key: WindowId, e: React.MouseEvent<HTMLDivElement>) => {
      if (!(e.target as HTMLElement).classList.contains("draggable")) {
        return;
      }

      if (getWindowHidden(key)) {
        // The user may be clicking on full screen Milkdrop.
        return;
      }

      const windows = windowsInfo.filter(
        (w) => propsWindows[w.key] != null && !getWindowHidden(w.key)
      );
      const targetNode = windows.find((node) => node.key === key);
      if (targetNode == null) {
        throw new Error(`Tried to move a node that does not exist: ${key}`);
      }

      let movingSet = new Set([targetNode]);
      // Only the main window brings other windows along.
      if (key === "main") {
        const findAllConnected = SnapUtils.traceConnection<WindowInfo>(abuts);
        movingSet = findAllConnected(windows, targetNode);
      }

      const stationary = windows.filter((w) => !movingSet.has(w));
      const moving = Array.from(movingSet);

      const mouseStart = { x: e.clientX, y: e.clientY };

      const boundingBox = SnapUtils.boundingBox(moving);
      setDraggingState({ boundingBox, moving, stationary, mouseStart });
    },
    [getWindowHidden, propsWindows, windowsInfo]
  );
}

export default function WindowManager({ windows: propsWindows }: Props) {
  const windowsInfo = useTypedSelector(Selectors.getWindowsInfo);
  const setFocusedWindow = useActionCreator(Actions.setFocusedWindow);
  const handleMouseDown = useHandleMouseDown(propsWindows);
  const updateWindowPositions = useActionCreator(Actions.updateWindowPositions);
  const centerWindowsInView = useActionCreator(Actions.centerWindowsInView);
  const setWindowSize = useActionCreator(Actions.setWindowSize);
  const toggleWindow = useActionCreator(Actions.toggleWindow);

  const windows = windowsInfo.filter((w) => propsWindows[w.key]);

  if (!posOnStart) {
    if (document.getElementById('playlist-window')) {
      ipcRenderer.invoke('getSettings').then((rs: any) => {
        const settingsData = JSON.parse(rs);

        if (settingsData.windows) {
            ipcRenderer.invoke('movingWindowStarted').then(() => {
                let obj = windows.find((o, i) => {
                  if (o.key === 'main') {
                      windows[i].x = settingsData.windows.mainWindow.x;
                      windows[i].y = settingsData.windows.mainWindow.y;
                  }
                  if (o.key === 'playlist') {
                    windows[i].x = settingsData.windows.playlistWindow.x;
                    windows[i].y = settingsData.windows.playlistWindow.y;
                    setWindowSize(o.key, settingsData.windows.playlistWindow.size);
                  }
                  if (o.key === 'equalizer') {
                    windows[i].x = settingsData.windows.equalizerWindow.x;
                    windows[i].y = settingsData.windows.equalizerWindow.y;
                  }
                });
                const newPositions = windowsInfo.reduce(
                  (pos, w) => ({
                    ...pos,
                    [w.key]: { x: w.x, y: w.y },
                  }),
                  {}
                );

                updateWindowPositions(newPositions, false);
                centerWindowsInView();
                if (!settingsData.windows.playlistWindow.visible) {
                  toggleWindow('playlist');
                }
                if (!settingsData.windows.equalizerWindow.visible) {
                  toggleWindow('equalizer');
                }
                ipcRenderer.invoke('movingWindowEndedWithoutSave').then(() => {});
                posOnStart = true;
              });
        }
      })
    }
  }


  const onBlur = useCallback(
    // I give up on trying to type things with `relatedTarget`.
    (e: any) => {
      const { currentTarget, relatedTarget } = e;
      if (
        currentTarget === relatedTarget ||
        currentTarget.contains(relatedTarget)
      ) {
        return;
      }
      setFocusedWindow(null);
    },
    [setFocusedWindow]
  );

  return (
    <>
      {windows.map((w) => (
        <div
          key={w.key}
          id={w.key}
          onBlur={onBlur}
          onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
            handleMouseDown(w.key, e);
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: `translate(${w.x}px, ${w.y}px)`,
          }}
        >
          {propsWindows[w.key]}
        </div>
      ))}
    </>
  );
}
