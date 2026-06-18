import { memo } from "react";
import classnames from "classnames";

import * as Selectors from "../../selectors";
import { useActionCreator, useTypedSelector } from "../../hooks";
import { toggleWindowAndSave } from "../../yaampPersistence";

function toggleEqualizer() {
  return toggleWindowAndSave("equalizer");
}

const EqToggleButton = memo(() => {
  const handleClick = useActionCreator(toggleEqualizer);
  const windowOpen = useTypedSelector(Selectors.getWindowOpen)("equalizer");
  return (
    <div
      id="equalizer-button"
      className={classnames({ selected: windowOpen })}
      onClick={handleClick}
      title="Toggle Graphical Equalizer"
    />
  );
});

export default EqToggleButton;
