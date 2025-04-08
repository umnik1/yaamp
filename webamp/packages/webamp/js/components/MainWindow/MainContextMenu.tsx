import { memo, Fragment, useEffect, useState, SetStateAction } from "react";
const { ipcRenderer } = window.require('electron');
import * as Actions from "../../actionCreators";
import * as Selectors from "../../selectors";
import { LOAD_STYLE } from "../../constants";
import { Hr, Node, Parent, LinkNode } from "../ContextMenu";
import PlaybackContextMenu from "../PlaybackContextMenu";
import OptionsContextMenu from "../OptionsContextMenu";
import SkinsContextMenu from "../SkinsContextMenu";
import { FilePicker } from "../../types";
import { useTypedSelector, useActionCreator } from "../../hooks";

interface Props {
  filePickers: FilePicker[];
}

const MainContextMenu = memo(({ filePickers }: Props) => {
  const networkConnected = useTypedSelector(Selectors.getNetworkConnected);
  const genWindows = useTypedSelector(Selectors.getGenWindows);

  const close = useActionCreator(Actions.close);
  const openMediaFileDialog = useActionCreator(Actions.openMediaFileDialog);
  const loadMediaFiles = useActionCreator(Actions.loadMediaFiles);
  const toggleWindow = useActionCreator(Actions.toggleWindow);
  const menuOpened = useActionCreator(() => ({
    type: "MAIN_CONTEXT_MENU_OPENED",
  }));
  const [playlists, setPlaylists] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [rotors, setRotors] = useState([]);
  const [playlistgetted, setPlaylistgetted] = useState(false);
  const [searchResult, setsearchResult] = useState([]);
  const [lendings, setLendings] = useState([]);
  const [data, setData] = useState<any>([]);
  const [userSettings, setUserSettings] = useState<any>([]);

  const handleChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    ipcRenderer.invoke("search", {searchText: event.target.value}).then((rs: any) => {
      setsearchResult(rs);
    })
  };

  useEffect(() => {
    if (!playlistgetted) {
      setPlaylistgetted(true);
      ipcRenderer.invoke("nowPlaylist").then((data: any) => {
        setData(data);
      })
      ipcRenderer.invoke('getUserPlaylists').then((rs: any) => {
        setPlaylists(rs);
      })
      ipcRenderer.invoke('getUserArtists').then((rs: any) => {
        setArtists(rs);
      })
      ipcRenderer.invoke('getUserAlbums').then((rs: any) => {
        setAlbums(rs);
      })
      ipcRenderer.invoke('getRotor').then((rs: any) => {
        setRotors(rs);
      })
      ipcRenderer.invoke('lendings').then((rs: any) => {
        setLendings(rs);
      })
      ipcRenderer.invoke('getSettings').then((rs: any) => {
        setUserSettings(JSON.parse(rs));
      })
    }

    menuOpened();
  }, [menuOpened]);

  return (
    <Fragment>
      {
        (data.uid) ? (
          <>
          <Node onClick={async () => {
            ipcRenderer.invoke("openLink", { link: "https://yaamp.ru/" }).then(() => { });
          } } label={data.title} />
          <Node onClick={async () => {
            ipcRenderer.invoke("setPlaylistRecomendation", { uid: data.uid, kind: data.kind }).then(() => { });
          } } label="Рекомендации по плейлисту" />
        </>
        ) : (
          <Node onClick={async () => {
            ipcRenderer.invoke("openLink", {link: "https://yaamp.ru/"}).then(() => {})
          }} label="Yaamp" />
        )
      }
      <Hr />
      <Node onClick={async () => {
        ipcRenderer.invoke("setMywave").then(() => {})
      }} label="Моя волна" />
      <Node onClick={async () => {
        ipcRenderer.invoke("setMyloved").then(() => {})
      }} label="Любимые треки" />
      <Hr />
      <Parent label="Начальные плейлисты">
        {lendings.map((result: any) => {
          return (
            <Node onClick={async () => {
              ipcRenderer.invoke("setPlaylist", {uid: result.data.data.uid, kind: result.data.data.kind }).then(() => {})
            }} label={result.data.data.title} />
          );
        })}
      </Parent>
      <Hr />
      <Parent label="Поиск...">
        <li className="input" id="notClose"><input className="searchField" type="text" id="notClose" placeholder="Введите текст..." onChange={handleChange} /></li>
        <Hr />
        {searchResult.map((result: any) => {
          return (
            <Node onClick={async () => {
              if (result.type == 'artist') {
                ipcRenderer.invoke("setArtist", {id: result.id }).then(() => {})
              }
              if (result.type == 'album') {
                ipcRenderer.invoke("setAlbum", {id: result.id }).then(() => {})
              }
            }} label={result.name} />
          );
        })}
      </Parent>
      <Hr />
      <Parent label="Плейлисты">
        {playlists.map((playlist: any) => {
          return (
            <Node onClick={async () => {
              ipcRenderer.invoke("setPlaylist", {uid: playlist.uid, kind: playlist.kind }).then(() => {})
            }} label={playlist.title} />
          );
        })}
      </Parent>
      <Parent label="Исполнители">
        {artists.map((artist: any) => {
          return (
            <Node onClick={async () => {
              ipcRenderer.invoke("setArtist", {id: artist.id }).then(() => {})
            }} label={artist.title} />
          );
        })}
      </Parent>
      <Parent label="Альбомы">
        {albums.map((album: any) => {
          return (
            <Node onClick={async () => {
              ipcRenderer.invoke("setAlbum", {id: album.id }).then(() => {})
            }} label={album.title} />
          );
        })}
      </Parent>
      <Parent label="Станции">
        {rotors.map((rotor: any) => {
          return (
            <Node onClick={async () => {
              ipcRenderer.invoke("setRotor", {id: rotor.id }).then(() => {})
            }} label={rotor.title} />
          );
        })}
      </Parent>
      <Hr />
      <Node onClick={async () => {
        ipcRenderer.invoke("openPlayNow").then(() => {})
      }} label="Сейчас играет..." />
      <Node onClick={async () => {
        ipcRenderer.invoke("setLike").then(() => {})
      }} label="Лайк" />
      <Node onClick={async () => {
        ipcRenderer.invoke("setDislike").then(() => {})
      }} label="Дизлайк" />
      <Hr />
      {Object.keys(genWindows).map((i) => (
        <Node
          key={i}
          label={genWindows[i].title}
          checked={genWindows[i].open}
          onClick={() => toggleWindow(i)}
          hotkey={genWindows[i].hotkey}
        />
      ))}
      <Hr />
      <SkinsContextMenu />
      <Hr />
      <Parent label="Увеличение">
        <Node onClick={async () => {
          ipcRenderer.invoke("setRatio", {value: 1}).then(() => {})
        }}
          label="x1"
          checked={ userSettings.zoom === 1 }
         />
        <Node onClick={async () => {
          ipcRenderer.invoke("setRatio", {value: 1.2}).then(() => {})
        }}
          label="x1.2"
          checked={ userSettings.zoom === 1.2 }
        />
        <Node onClick={async () => {
          ipcRenderer.invoke("setRatio", {value: 1.4}).then(() => {})
        }}
          label="x1.4"
          checked={ userSettings.zoom === 1.4 }
        />
        <Node onClick={async () => {
          ipcRenderer.invoke("setRatio", {value: 1.6}).then(() => {})
        }}
          label="x1.6"
          checked={ userSettings.zoom === 1.6 }
        />
        <Node onClick={async () => {
          ipcRenderer.invoke("setRatio", {value: 1.8}).then(() => {})
        }}
          label="x1.8"
          checked={ userSettings.zoom === 1.8 }
        />
      </Parent>
      <Parent label="Options">
        <OptionsContextMenu />
      </Parent>
      <Parent label="Playback">
        <PlaybackContextMenu />
      </Parent>
      <Hr />
      <Node onClick={async () => {
        ipcRenderer.invoke("openLink", {link: "https://yaamp.ru/donate.php"}).then(() => {})
      }} label="Поддержать проект" />
      <Hr />
      <Node onClick={async () => {
        ipcRenderer.invoke("logout").then(() => {})
      }} label="Выйти из аккаунта" />
      <Node onClick={close} label="Exit" />
    </Fragment>
  );
});

export default MainContextMenu;
