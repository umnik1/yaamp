import { ReactNode } from "react";
import { Hr, Node, Parent } from "../ContextMenu";
import { WINDOWS } from "../../constants";
import * as Selectors from "../../selectors";
import * as Actions from "../../actionCreators";
import ContextMenuWraper from "../ContextMenuWrapper";
import { useTypedSelector, useActionCreator } from "../../hooks";
// @ts-ignore
import butterchurnPresets from 'butterchurn-presets';
import _ from "lodash";

interface Props {
  children: ReactNode;
}

const MilkdropContextMenu = (props: Props) => {
  const desktop = useTypedSelector(Selectors.getMilkdropDesktopEnabled);
  const currentPreset = useTypedSelector(Selectors.getCurrentPreset);
  const currentLock = useTypedSelector(Selectors.getMilkdropLockEnabled);

  const closeWindow = useActionCreator(Actions.closeWindow);
  const toggleDesktop = useActionCreator(Actions.toggleMilkdropDesktop);
  const toggleFullscreen = useActionCreator(Actions.toggleMilkdropFullscreen);
  const toggleLock = useActionCreator(Actions.toggleMilkdropLock);
  const selectNextPreset = useActionCreator(Actions.selectNextPreset);
  const selectPreset = useActionCreator(Actions.selectPreset);

  const presets = butterchurnPresets.getPresets();
  const presetKeys = _.keys(presets);
  
  return (
    <ContextMenuWraper
      renderContents={() => {
        return (
          <>
            <Node
              onClick={toggleFullscreen}
              label="Fullscreen"
              hotkey="Alt+Enter"
            />
            <Node onClick={toggleLock} label="Lock preset" checked={currentLock} />
            <Parent label="Select preset">
                {presetKeys.map((presetKey: any) => {
                  return (
                    <Node onClick={() => selectPreset(presetKey)} label={presetKey} checked={presetKey == currentPreset} />
                  );
                })}
            </Parent>
            {/* <Node
              onClick={toggleDesktop}
              checked={desktop}
              label="Desktop Mode"
              hotkey="Alt+D"
            /> */}
            <Hr />
            <Node onClick={() => closeWindow(WINDOWS.MILKDROP)} label="Quit" />
          </>
        );
      }}
    >
      {props.children}
    </ContextMenuWraper>
  );
};

export default MilkdropContextMenu;
