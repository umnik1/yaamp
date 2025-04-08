import { useCallback, ReactNode } from "react";
import classnames from "classnames";
import {
  CLICKED_TRACK,
  CTRL_CLICKED_TRACK,
  SHIFT_CLICKED_TRACK,
} from "../../actionTypes";
import * as Selectors from "../../selectors";
import * as Actions from "../../actionCreators";
import {
  useTypedSelector,
  useActionCreator,
  useTypedDispatch,
} from "../../hooks";

interface Props {
  id: number;
  index: number;
  handleMoveClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

function TrackCell({ children, handleMoveClick, index, id }: Props) {
  const skinPlaylistStyle = useTypedSelector(Selectors.getSkinPlaylistStyle);
  const selectedTrackIds = useTypedSelector(Selectors.getSelectedTrackIds);
  const currentTrackId = useTypedSelector(Selectors.getCurrentTrackId);
  const selected = selectedTrackIds.has(id);
  const current = currentTrackId === id;

  const dispatch = useTypedDispatch();
  const playTrackNow = useActionCreator(Actions.playTrackNow);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.shiftKey) {
        e.preventDefault();
        dispatch({ type: SHIFT_CLICKED_TRACK, index });
        return;
      } else if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        dispatch({ type: CTRL_CLICKED_TRACK, index });
        return;
      }

      if (!selected) {
        dispatch({ type: CLICKED_TRACK, index });
      }

      handleMoveClick(e);
    },
    [dispatch, handleMoveClick, index, selected]
  );

  const style: React.CSSProperties = {
    backgroundColor: selected ? skinPlaylistStyle.selectedbg : undefined,
    color: current ? skinPlaylistStyle.current : undefined,
  };
  return (
    <div
      className={classnames("track-cell", { selected, current })}
      style={style}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={onMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      onDoubleClick={() => playTrackNow(id)}
    >
      {children}
    </div>
  );
}

export default TrackCell;
