// webamp/packages/webamp/js/components/MilkdropWindow/Visualizer.tsx
import { useEffect, useState, useRef } from "react";
import * as Selectors from "../../selectors";
import { TransitionType } from "../../types";
import { useTypedSelector, useActionCreator } from "../../hooks";
import * as Actions from "../../actionCreators";
import { VISUALIZERS } from "../../constants";
import _ from 'lodash';

// @ts-ignore
import butterchurn from 'butterchurn';
// @ts-ignore
import butterchurnPresets from 'butterchurn-presets';

type ButterchurnVisualizer = {
  setRendererSize(width: number, height: number): void;
  loadPreset(preset: Object, transitionTime: number): void;
  launchSongTitleAnim(title: string): void;
  render(): void;
};

interface Props {
  analyser: AnalyserNode;
  height: number;
  width: number;
}

const TRANSITION_TYPE_DURATIONS = {
  [TransitionType.DEFAULT]: 2.7,
  [TransitionType.IMMEDIATE]: 0,
  [TransitionType.USER_PRESET]: 5.7,
};

function Visualizer({ analyser, width, height }: Props) {
  const visualizerStyle = useTypedSelector(Selectors.getVisualizerStyle);
  const playing = useTypedSelector(Selectors.getMediaIsPlaying);
  const trackTitle = useTypedSelector(Selectors.getCurrentTrackDisplayName);
  const currentPreset = useTypedSelector(Selectors.getCurrentPreset);
  const lock = useTypedSelector(Selectors.getMilkdropLockEnabled);
  const transitionType = useTypedSelector(Selectors.getPresetTransitionType);
  const message = useTypedSelector(Selectors.getMilkdropMessage);
  const selectPreset = useActionCreator(Actions.selectPreset);

  const isEnabledVisualizer = visualizerStyle === VISUALIZERS.MILKDROP;

  const canvasRef = useRef(null);
  const [visualizer, setVisualizer] = useState<ButterchurnVisualizer | null>(
    null
  );

  const lastShownMessage = useRef<number | null>(null);
  const presets = butterchurnPresets.getPresets();
  const presetKeys = _.keys(presets);

  useEffect(() => {
    if (canvasRef.current == null || butterchurn == null) {
      console.error("Canvas or Butterchurn is not initialized!");
      return;
    }
    if (visualizer != null) {
      // Note: The visualizer does not offer anyway to clean itself up. So, we
      // don't offer any way to recreate it. So, if you swap out the analyser
      // node, or the canvas, that change won't be respected.
      return;
    }
    const _visualizer = butterchurn.createVisualizer(
      analyser.context,
      canvasRef.current,
      {
        width,
        height,
        meshWidth: 32,
        meshHeight: 24,
        pixelRatio: window.devicePixelRatio || 1,
      }
    );
    _visualizer.connectAudio(analyser);
    if (!lock) {
      const randomPresetKey = presetKeys[Math.floor(Math.random() * presetKeys.length)];
      const preset = presets[randomPresetKey];
      _visualizer.loadPreset(preset, 0.3);
      setVisualizer(_visualizer);
      selectPreset(randomPresetKey);
    } else {
      _visualizer.loadPreset(currentPreset, 0.3);
      setVisualizer(_visualizer);
    }

  }, [butterchurn, analyser, height, width, visualizer]);

  // Ensure render size stays up to date
  useEffect(() => {
    if (visualizer == null) {
      return;
    }
    visualizer.setRendererSize(width, height);
  }, [visualizer, width, height]);

  // Load presets when they change
  const hasLoadedPreset = useRef<boolean>(false);
  useEffect(() => {

    if (visualizer == null || currentPreset == null) {
      return;
    }
    if (hasLoadedPreset.current) {
      visualizer.loadPreset(
        currentPreset,
        TRANSITION_TYPE_DURATIONS[transitionType]
      );
    } else {
      visualizer.loadPreset(
        currentPreset,
        TRANSITION_TYPE_DURATIONS[TransitionType.IMMEDIATE]
      );
      hasLoadedPreset.current = true;
    }
    // We don't want to trigger the transition if the transition type changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualizer, currentPreset]);

  // Handle title animations and change preset
  useEffect(() => {
    if (visualizer == null || !trackTitle) {
      return;
    }

    if (!lock) {
      const randomPresetKey = presetKeys[Math.floor(Math.random() * presetKeys.length)];
      const preset = presets[randomPresetKey];
      selectPreset(randomPresetKey);
      visualizer.loadPreset(preset, 0.3);
    } else {
      visualizer.loadPreset(currentPreset, 0.3);
      setVisualizer(visualizer);
    }

    visualizer.launchSongTitleAnim(trackTitle);
  }, [visualizer, trackTitle]);

  useEffect(() => {
    if (visualizer == null || message == null) {
      return;
    }
    if (
      lastShownMessage.current == null ||
      message.time > lastShownMessage.current
    ) {
      lastShownMessage.current = Date.now();
      const randomPresetKey = presetKeys[Math.floor(Math.random() * presetKeys.length)];
      const preset = presets[randomPresetKey];
      visualizer.loadPreset(preset, 0.3);
      visualizer.launchSongTitleAnim(message.text);
    }
  }, [visualizer, message]);

  const shouldAnimate = playing && isEnabledVisualizer;

  // Kick off the animation loop
  useEffect(() => {
    if (!shouldAnimate || visualizer == null) {
      return;
    }
    let animationFrameRequest: number | null = null;
    const loop = () => {
      visualizer.render();
      animationFrameRequest = window.requestAnimationFrame(loop);
    };
    loop();
    return () => {
      if (animationFrameRequest != null) {
        window.cancelAnimationFrame(animationFrameRequest);
      }
    };
  }, [visualizer, shouldAnimate]);

  return (
    <canvas
      height={height}
      width={width}
      style={{
        height: "100%",
        width: "100%",
        display: isEnabledVisualizer ? "block" : "none",
      }}
      ref={canvasRef}
    />
  );
}

export default Visualizer;