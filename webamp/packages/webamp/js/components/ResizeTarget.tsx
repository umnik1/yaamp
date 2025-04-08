import { useState, useEffect, memo } from "react";
import {
  WINDOW_RESIZE_SEGMENT_WIDTH,
  WINDOW_RESIZE_SEGMENT_HEIGHT,
} from "../constants";
const { ipcRenderer } = window.require('electron');

type Size = [number, number];

interface Props {
  currentSize: Size;
  setWindowSize(size: Size): void;
  widthOnly?: boolean;
  id?: string;
}

function ResizeTarget(props: Props) {
  const { currentSize, setWindowSize, widthOnly, ...passThroughProps } = props;
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseStart, setMouseStart] = useState<null | { x: number; y: number }>(
    null
  );
  let currentNewSize = [0, 0];

  useEffect(() => {
    if (mouseDown === false || mouseStart == null) {
      return;
    }
    const [width, height] = currentSize;
    const handleMove = (ee: MouseEvent) => {
      const x = ee.clientX - mouseStart.x;
      const y = ee.clientY - mouseStart.y;

      const newWidth = Math.max(
        0,
        width + Math.round(x / WINDOW_RESIZE_SEGMENT_WIDTH)
      );

      const newHeight = widthOnly
        ? width
        : Math.max(0, height + Math.round(y / WINDOW_RESIZE_SEGMENT_HEIGHT));

      const newSize: Size = [newWidth, newHeight];
      currentNewSize = newSize;

      props.setWindowSize(newSize);
    };

    window.addEventListener("mousemove", handleMove);

    const handleMouseUp = () => { setMouseDown(false); ipcRenderer.invoke('setSize', {size: currentNewSize}).then((rs: any) => {}); }
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // We pruposefully close over the props from when the mouse went down
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mouseStart, mouseDown]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent dragging from highlighting text.
    e.preventDefault();
    setMouseStart({
      x: e.clientX,
      y: e.clientY,
    });
    setMouseDown(true);
  };

  return <div onMouseDown={handleMouseDown} {...passThroughProps} />;
}
export default memo(ResizeTarget);
