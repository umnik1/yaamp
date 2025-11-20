import { Slider, Action } from "./../types";

import {
  SET_BAND_VALUE,
  SET_EQ_AUTO,
  SET_EQ_ON,
  SET_EQ_OFF,
  LOAD_SERIALIZED_STATE,
} from "../actionTypes";
import { EqualizerSerializedStateV1 } from "../serializedStates/v1Types";

export interface EqualizerState {
  on: boolean;
  auto: boolean;
  sliders: Record<Slider, number>;
}

const defaultState = {
  on: true,
  auto: false,
  sliders: {
    preamp: 1200,
    60: 1200,
    170: 1200,
    310: 1200,
    600: 1200,
    1000: 1200,
    3000: 1200,
    6000: 1200,
    12000: 1200,
    14000: 1200,
    16000: 1200,
  },
};

function migrateSliderValues(sliders: Record<Slider, number>): Record<Slider, number> {
  const migrated: Record<Slider, number> = { ...sliders };
  
  const needsMigration = Object.values(sliders).some(val => val > 0 && val <= 100 && val !== 0);
  
  if (needsMigration) {
    Object.keys(migrated).forEach(key => {
      const value = migrated[key as Slider];
      if (value >= 0 && value <= 100) {
        migrated[key as Slider] = Math.round((value / 100) * 2400);
      }
    });
  }
  
  return migrated;
}

const equalizer = (
  state: EqualizerState = defaultState,
  action: Action
): EqualizerState => {
  switch (action.type) {
    case SET_BAND_VALUE:
      const newSliders = { ...state.sliders, [action.band]: action.value };
      return { ...state, sliders: newSliders };
    case SET_EQ_ON:
      return { ...state, on: true };
    case SET_EQ_OFF:
      return { ...state, on: false };
    case SET_EQ_AUTO:
      return { ...state, auto: action.value };
    case LOAD_SERIALIZED_STATE:
      if (action.serializedState.equalizer) {
        const loadedState = action.serializedState.equalizer;
        return {
          ...loadedState,
          sliders: migrateSliderValues(loadedState.sliders),
        };
      }
      return state;
    default:
      return state;
  }
};

export function getSerializedState(
  state: EqualizerState
): EqualizerSerializedStateV1 {
  return state;
}

export default equalizer;
