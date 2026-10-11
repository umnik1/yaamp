import { ReactNode, useState, useEffect, useLayoutEffect, useCallback } from "react";
import ContextMenu from "./ContextMenu";

declare global {
  interface Window {
    updateElectronWindowBounds?: () => void;
    getContextMenuArea?: () => MenuArea;
  }
}

// Доступная для меню область в пикселях страницы.
type MenuArea = { left: number; top: number; right: number; bottom: number };

// Позиция меню по одной оси в пределах [min, max].
function placeMenu(click: number, size: number, min: number, max: number) {
  if (size <= 0 || click + size <= max + 1) {
    return click;
  }
  if (click - size >= min) {
    return click - size;
  }
  return Math.max(min, max - size);
}

interface Props {
  renderContents(): ReactNode;
  children: ReactNode;
}

// Trigger a context menu at the user's cursor position when the user right
// clicks within this component.
// For a component that triggers relative to a given component when the user
// left-clicks see `<ContextMenuTarget />`.

// TODO: Consider using nested contexts to ensure we don't ever have multiple
// non-nested context menus open at a time.
export default function ContextMenuWraper({
  children,
  renderContents,
  ...passThroughProps
}: Props) {
  const [openPosition, setOpenPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const closeMenu = useCallback(() => {
    setOpenPosition(null);
    setMenuPosition(null);
    window.updateElectronWindowBounds?.();
  }, []);

  const handleGlobalClick = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 2) {
        if (e.target instanceof Element && e.target.id !== "notClose") {
          closeMenu();
        }
      }
    },
    [closeMenu]
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const { pageX, pageY } = e;
      setOpenPosition({ x: pageX, y: pageY });
      setMenuPosition({ x: pageX, y: pageY });
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  useLayoutEffect(() => {
    if (openPosition == null) {
      return;
    }

    const adjustMenu = () => {
      const menuEl = document.querySelector(
        "#webamp-context-menu .context-menu"
      );
      if (!menuEl) {
        return;
      }

      window.updateElectronWindowBounds?.();

      const menuRect = menuEl.getBoundingClientRect();
      const area = window.getContextMenuArea?.() ?? {
        left: 0,
        top: 0,
        right: document.documentElement.clientWidth,
        bottom: document.documentElement.clientHeight,
      };
      const { x: clickX, y: clickY } = openPosition;
      const nextX = placeMenu(clickX, menuRect.width, area.left, area.right);
      const nextY = placeMenu(clickY, menuRect.height, area.top, area.bottom);

      setMenuPosition((prev) => {
        if (prev?.x === nextX && prev?.y === nextY) {
          return prev;
        }
        return { x: nextX, y: nextY };
      });

      if (nextX !== clickX || nextY !== clickY) {
        window.updateElectronWindowBounds?.();
      }
    };

    adjustMenu();
    requestAnimationFrame(() => {
      adjustMenu();
      requestAnimationFrame(adjustMenu);
    });
  }, [openPosition]);

  // Add click-away listeners when window is open
  useEffect(() => {
    if (openPosition == null) {
      return;
    }

    const handleMenuHover = () => {
      window.updateElectronWindowBounds?.();
    };

    const menuRoot = document.getElementById("webamp-context-menu");
    menuRoot?.addEventListener("mouseover", handleMenuHover);

    document.addEventListener("click", handleGlobalClick);
    document.body.addEventListener("contextmenu", closeMenu);

    return () => {
      menuRoot?.removeEventListener("mouseover", handleMenuHover);
      document.removeEventListener("click", handleGlobalClick);
      document.body.removeEventListener("contextmenu", closeMenu);
    };
  }, [openPosition, closeMenu, handleGlobalClick]);

  return (
    <div
      onContextMenu={handleRightClick}
      style={{ width: "100%", height: "100%" }}
      {...passThroughProps}
    >
      <ContextMenu
        selected={openPosition != null}
        offsetTop={menuPosition?.y ?? openPosition?.y ?? 0}
        offsetLeft={menuPosition?.x ?? openPosition?.x ?? 0}
      >
        {renderContents()}
      </ContextMenu>
      {children}
    </div>
  );
}
