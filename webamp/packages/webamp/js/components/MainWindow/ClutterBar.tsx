import { memo } from "react";
import classnames from "classnames";

import * as Actions from "../../actionCreators";
import { Action, Thunk } from "../../types";
import OptionsContextMenu from "../OptionsContextMenu";
import ContextMenuTarget from "../ContextMenuTarget";
import { useActionCreator, useTypedSelector } from "../../hooks";
import * as Selectors from "../../selectors";

const { ipcRenderer } = window.require('electron');

function setFocusDouble(): Action {
  return Actions.setFocus("double");
}

function mouseUp(): Thunk {
  return (dispatch) => {
    dispatch(Actions.toggleDoubleSizeMode());
    dispatch(Actions.unsetFocus());
  };
}

const ClutterBar = memo(() => {
  const handleMouseDown = useActionCreator(setFocusDouble);
  const handleMouseUp = useActionCreator(mouseUp);
  const doubled = useTypedSelector(Selectors.getDoubled);
  return (
    <div id="clutter-bar">
      <ContextMenuTarget bottom renderMenu={() => <OptionsContextMenu />}>
        <div id="button-o" />
      </ContextMenuTarget>
      <div id="button-a"
        title={"Лайк"}
        onMouseUp={async () => {
          ipcRenderer.invoke("setLike").then(() => {})
        }}
      />
      <div id="button-i"
        title={"Моя волна"}
        onMouseUp={async () => {
          ipcRenderer.invoke("setMywave").then(() => {})
        }}
        />
      <div
        title={"Toggle Doublesize Mode"}
        id="button-d"
        className={classnames({ selected: doubled })}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
      />
      <div id="button-v" />
    </div>
  );
});

export default ClutterBar;
