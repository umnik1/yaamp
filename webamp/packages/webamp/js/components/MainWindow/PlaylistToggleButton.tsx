import { memo } from "react";
import classnames from "classnames";

import * as Selectors from "../../selectors";
import { useTypedSelector, useActionCreator } from "../../hooks";
import { toggleWindowAndSave } from "../../yaampPersistence";

function togglePlaylist() {
  return toggleWindowAndSave("playlist");
}

const PlaylistToggleButton = memo(() => {
  const selected = useTypedSelector(Selectors.getWindowOpen)("playlist");
  const handleClick = useActionCreator(togglePlaylist);
  return (
    <div
      id="playlist-button"
      className={classnames({ selected })}
      onClick={handleClick}
      title="Toggle Playlist Editor"
    />
  );
});

export default PlaylistToggleButton;
