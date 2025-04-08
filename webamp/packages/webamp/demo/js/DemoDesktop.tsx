import WebampLazy from "../../js/webampLazy";
import { Suspense } from "react";
import WebampIcon from "./WebampIcon";
// import Mp3Icon from "./Mp3Icon";
import SkinIcon from "./SkinIcon";
import { /* defaultInitialTracks, */ SHOW_DESKTOP_ICONS } from "./config";
import { useWindowSize } from "../../js/hooks";
import avaliableSkins from "./avaliableSkins";
import DesktopLinkIcon from "./DesktopLinkIcon";
import museumIcon from "../images/icons/internet-folder-32x32.png";
// import MilkIcon from "./MilkIcon";

interface Props {
  webamp: WebampLazy;
}

const ICON_WIDTH = 75;
const ICON_HEIGHT = 100;
const VERTICAL_MARGIN = 30;
const HORIZONTAL_MARGIN = 10;

const DemoDesktop = ({ webamp }: Props) => {
  const { width } = useWindowSize();
  const visibleWidth = width - VERTICAL_MARGIN * 2;

  const columns = Math.floor(visibleWidth / ICON_WIDTH);

  const icons = [<WebampIcon webamp={webamp} />];

  if (SHOW_DESKTOP_ICONS) {
    icons.push(
      /*
      ...defaultInitialTracks.map((track) => {
        return <Mp3Icon webamp={webamp} track={track} />;
      }),
      */
      ...avaliableSkins.map((skin) => {
        return <SkinIcon webamp={webamp} skin={skin} />;
      }),
      /*
      <MilkIcon
        webamp={webamp}
        preset={{
          url:
            "https://s3-us-east-2.amazonaws.com/butterchurn-presets/65b9eea6e1cc6bb9f0cd2a47751a186f.json",
          name: "105",
        }}
      />
      */ <DesktopLinkIcon
        iconUrl={museumIcon}
        name="Winamp Skin Musuem"
        href={"https://skins.webamp.org"}
      />
    );
  }
  return (
    <div
      id="desktop"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        // bottom: 0,
        marginTop: VERTICAL_MARGIN,
        marginLeft: HORIZONTAL_MARGIN,
      }}
    >
      <Suspense
        fallback={null /* Wait for all icons to load before showing any */}
      >
        {icons.map((icon, i) => {
          const row = Math.floor(i / columns);
          const column = i % columns;
          return (
            <div
              key={i}
              style={{
                left: column * ICON_WIDTH,
                top: row * ICON_HEIGHT,
                width: ICON_WIDTH,
                position: "absolute",
              }}
            >
              {icon}
            </div>
          );
        })}
      </Suspense>
    </div>
  );
};

export default DemoDesktop;
