import { useMemo } from "react";
import { Slider as SliderType } from "../../types";
import { useTypedSelector, useActionCreator } from "../../hooks";
import * as Selectors from "../../selectors";
import * as Actions from "../../actionCreators";
import VerticalSlider from "../VerticalSlider";

interface Props {
  id: string;
  band: SliderType;
  onChange(value: number): void;
}

const MAX_VALUE = 2400; // New range for 0.1 dB precision

// Given a value between 0-2400, return the sprite number (0-27)
export const spriteNumber = (value: number): number => {
  const percent = value / MAX_VALUE;
  return Math.round(percent * 27);
};

// Given a sprite number, return the x,y
export const spriteOffsets = (number: number): { x: number; y: number } => {
  const x = number % 14;
  const y = Math.floor(number / 14);
  return { x, y };
};

const Handle = () => {
  const style = { width: 11, height: 11, marginLeft: 1 };
  return <div style={style} className="slider-handle" />;
};

export default function Band({ id, onChange, band }: Props) {
  const sliders = useTypedSelector(Selectors.getSliders);
  const value = sliders[band];
  const backgroundPosition = useMemo(() => {
    const { x, y } = spriteOffsets(spriteNumber(value));
    const xOffset = x * 15; // Each sprite is 15px wide
    const yOffset = y * 65; // Each sprite is 15px tall
    return `-${xOffset}px -${yOffset}px`;
  }, [value]);
  const focusBand = useActionCreator(Actions.focusBand);
  const usetFocus = useActionCreator(Actions.unsetFocus);

  // Round to nearest 0.1 dB step (24 dB / 2400 = 0.01 dB per unit, but we want 0.1 dB steps)
  // Each 0.1 dB step = 10 units in our 0-2400 range
  const roundToStep = (val: number): number => {
    return Math.round(val / 10) * 10;
  };

  // Note: The band background is actually one pixel taller (63) than the slider
  // it contains (62).
  return (
    <div id={id} className="band" style={{ backgroundPosition, height: 63 }}>
      <VerticalSlider
        height={62}
        width={14}
        handleHeight={11}
        value={1 - value / MAX_VALUE}
        onBeforeChange={() => focusBand(band)}
        onChange={(val) => {
          const newValue = (1 - val) * MAX_VALUE;
          onChange(roundToStep(newValue));
        }}
        onAfterChange={usetFocus}
        handle={<Handle />}
      />
    </div>
  );
}
