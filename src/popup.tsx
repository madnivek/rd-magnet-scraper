import React, {
  FunctionComponent,
  useState,
  useCallback,
  ChangeEventHandler,
  FormEventHandler,
  useEffect,
} from "react";
import ReactDOM from "react-dom";
import "./popup.scss";
import { getScrapedMagnets, MagnetInfo, magnetRegex } from "./scrape";
import qs from "qs";
import copy from "clipboard-copy";
import classNames from 'classnames';
import { RD_API_KEY_KEY } from "./constants";
import RealDebridClient from "./rd";
import OptionsMenu from "./options-menu"; 

enum Status {
  "idle" = "idle",
  "loading" = "loading",
  "success" = "success",
  "error" = "error",
}

const STATUS: { [key in Status]: string } = {
  [Status.idle]: "fa-magnet",
  [Status.loading]: "fa-spin fa-spinner",
  [Status.success]: "fa-check",
  [Status.error]: "fa-exclamation-triangle",
};

let currentTabUrl: string = "";

const getActiveTabMagnetList = () => {
  chrome.tabs.executeScript({
    file: "js/scrapeTabMagnets.js",
  });
};

let RD_API_KEY = "";
let realDebrid: RealDebridClient;
chrome.storage.local.get([RD_API_KEY_KEY], ({ RD_API_KEY: key }) => {
  RD_API_KEY = key;
  realDebrid = new RealDebridClient(key);
});

interface StreamInfo {
  name: string;
  link: string;
}

const App: FunctionComponent = () => {
  const [url, setUrl] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [magnetList, setMagnetList] = useState<MagnetInfo[]>();
  const [statusByMagnet, setStatusByMagnet] = useState(new Map());
  const [streamableLinksByMagnet, setStreamableLinksByMagnet] = useState<
    Map<string, StreamInfo[]>
  >(new Map());
  const [linksByMagnet, setLinksByMagnet] = useState<Map<string, string[]>>(
    new Map()
  );

  const isCustomURL = currentTabUrl !== url;

  const handleOnChangeUrl = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      setUrl(e.target.value);
    },
    []
  );

  const handleOnChangeFrom = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      setFrom(e.target.value);
    },
    []
  );

  const handleOnChangeTo = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      setTo(e.target.value);
    },
    []
  );

  const handleOnSubmit = useCallback<FormEventHandler>(
    async (e) => {
      e.preventDefault();
      const fromInt = from ? parseInt(from, 10) : undefined;
      const toInt = from ? parseInt(to, 10) : undefined;
      if (!isCustomURL) {
        getActiveTabMagnetList();
      } else if (isCustomURL) {
        const magnetLinks = await getScrapedMagnets({
          url,
          from: fromInt,
          to: toInt,
        });
        setMagnetList(magnetLinks);
      }
    },
    [url, from, to]
  );

  const getOnClickMagnet = (href: string) => {
    return () => {
      if (getStatus(href) === Status.idle) {
        setStatusByMagnet((prev) => {
          const map = new Map(prev);
          map.set(href, Status.loading);
          return map;
        });
        postTorrents(href, true);
      }
    };
  };

  const postTorrents = async (
    magnet: string,
    shouldFetchVideoLinks?: boolean
  ): Promise<void> => {
    let streamingLinks: StreamInfo[] = [];
    try {
      const addMagnetRes = await realDebrid.addMagnet(magnet);
      if (!addMagnetRes.success) {
        throw new Error("Could not post magnet");
      }
      const { id: torrentId } = addMagnetRes.json;
      const selectFilesRes = await realDebrid.selectAllFiles(torrentId);
      if (!selectFilesRes.success) {
        throw new Error("Magnet added but could not select files");
      }
      const torrentInfoRes = await realDebrid.getTorrentInfo(torrentId);
      if (!torrentInfoRes.success) {
        throw new Error("Magnet added but could not get torrent info");
      }
      const { links } = torrentInfoRes.json;
      if (shouldFetchVideoLinks) {
        const unrestrictFilesRes = await Promise.all(
          links.map((link) => realDebrid.unrestrictLink(link))
        );
        await Promise.all(
          unrestrictFilesRes.map(async (res) => {
            if (res.success && res.json.streamable) {
              const url = `https://real-debrid.com/streaming-${res.json.id}`;
              streamingLinks.push({ name: res.json.filename, link: url });
            }
          })
        );
      }
      if (links && links.length > 0) {
        setLinksByMagnet((prev) => {
          const map = new Map(prev);
          map.set(magnet, links);
          return map;
        });
      }
      if (shouldFetchVideoLinks && streamingLinks.length > 0) {
        setStreamableLinksByMagnet((prev) => {
          const map = new Map(prev);
          map.set(magnet, streamingLinks);
          return map;
        });
      }
      setStatusByMagnet((prev) => {
        const map = new Map(prev);
        map.set(magnet, Status.success);
        return map;
      });
    } catch (e) {
      setStatusByMagnet((prev) => {
        const map = new Map(prev);
        map.set(magnet, Status.error);
        return map;
      });
      alert(e.message);
    }
  };

  const getStatus = useCallback(
    (href: string): Status => {
      return statusByMagnet.get(href) || Status.idle;
    },
    [statusByMagnet]
  );

  const copyAllMagnetLinks = useCallback(async (text: string) => {
    try {
      await copy(text);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 500)
    } catch {
      console.log('could not copy');
    }
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (tabs[0]) {
        let url = tabs[0].url;
        currentTabUrl = url || ";";
        setUrl(currentTabUrl);
      }
    });

    chrome.runtime.onMessage.addListener(async (mssg) => {
      const { hrefs, iframeSources } = JSON.parse(mssg) as { hrefs: string[], iframeSources: string[] };
      let list = hrefs.reduce<MagnetInfo[]>((acc, href) => {
        const decodedHref = decodeURIComponent(href);
        const matches = decodedHref.match(magnetRegex);
        if (matches && matches[0]) {
          let title = "";
          const params = qs.parse(decodedHref);
          if (typeof params.dn === "string") {
            title = params.dn;
          }
          acc.push({ href: matches[0], title });
        }
        return acc;
      }, []);
      console.log(iframeSources);
      if (iframeSources) {
        const results = await Promise.all(iframeSources.map(source => getScrapedMagnets({ url: source })));
        list = results.reduce<MagnetInfo[]>((acc, result) => {
          acc = [...acc, ...result];
          return acc;
        }, list)
      }
      setMagnetList(list);
    });
    getActiveTabMagnetList();
  }, []);

  const list = magnetList || [];
  const magnetMap = new Map(list.map((info) => [info.href, info]));
  const uniqueMagnetList = [...magnetMap.values()];

  if (!RD_API_KEY) {
    return (
      <OptionsMenu />
    );
  }

  return (
    <>
      <form onSubmit={handleOnSubmit}>
        <label>
          URL Prefix
          <input
            className="width-100"
            value={url}
            onChange={handleOnChangeUrl}
          />
        </label>
        <label>
          From (#)
          <input
            placeholder="optional"
            type="number"
            value={from}
            onChange={handleOnChangeFrom}
          />
        </label>
        <label>
          To (#)
          <input
            placeholder="optional"
            type="number"
            value={to}
            onChange={handleOnChangeTo}
          />
        </label>
        <button type="submit">find magnet links</button>
      </form>
      <div className="horizontal-border" />
      {uniqueMagnetList.length > 0 && (
        <div className="results">
          <header>
            Results for <u>{url}</u>
            {from && to && (
              <>
                from <u>{from}</u> to <u>{to}</u>
              </>
            )}
          </header>
          {uniqueMagnetList.map(({ title, href }, idx) => {
            const links = linksByMagnet.get(href);
            const streamableLinks = streamableLinksByMagnet.get(href);
            return (
              <div className="magnet-entry" key={href}>
                <div className="magnet-info grid-x grid-margin-x">
                  <div className="title cell auto">{title}</div>
                  <div className="cell shrink">
                    <i
                      onClick={getOnClickMagnet(href)}
                      className={`clickable fa ${STATUS[getStatus(href)]}`}
                    />
                  </div>
                </div>
                {links && (
                  <div className="links position-relative">
                    <div className="link-header">Available Download Links:</div>
                    <span
                      className={classNames('copy-text clickable position-absolute', { 'fa fa-copy': !isCopied })}
                      onClick={() => copyAllMagnetLinks(links.join("\n"))}
                    >
                      {isCopied && 'copied!'}
                    </span>
                    {links.map((link) => {
                      return (
                        <div className="link" key={link}>
                          {link}
                        </div>
                      );
                    })}
                  </div>
                )}
                {streamableLinks && (
                  <div className="links">
                    <div className="link-header streaming">
                      Available Streaming Links:
                    </div>
                    {streamableLinks.map((link) => {
                      return (
                        <a
                          className="link"
                          key={link.link}
                          href={link.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.name}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {uniqueMagnetList.length === 0 && <div className="empty">No results</div>}
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
