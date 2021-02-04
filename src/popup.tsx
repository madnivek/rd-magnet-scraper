import React, {
  FunctionComponent,
  useState,
  useCallback,
  ChangeEventHandler,
  FormEventHandler,
  useEffect,
  useRef,
} from "react";
import ReactDOM from "react-dom";
import "./App.scss";
import {
  getScrapedMagnets,
  MagnetInfo,
  postTorrents,
  scrapeLinkFromElement,
  scrapeLinkFromUrl,
} from "./scrape";

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

const getActiveTabDom = () => {
  chrome.tabs.executeScript({
    file: "js/getTabDOM.js",
  });
};

const App: FunctionComponent = () => {
  const [url, setUrl] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [magnetList, setMagnetList] = useState<MagnetInfo[]>();
  const [statusByMagnet, setStatusByMagnet] = useState(new Map());
  const activeTabDomRef = useRef<HTMLBodyElement>(null);

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
      if (activeTabDomRef.current && !isCustomURL) {
        setMagnetList(scrapeLinkFromElement(activeTabDomRef.current));
      } else if (isCustomURL) {
        const magnetLinks = await getScrapedMagnets({
          url,
          from: fromInt,
          to: toInt,
        });
        console.log(magnetLinks);
        setMagnetList(magnetLinks);
      }
    },
    [url, from, to]
  );

  const getOnClickMagnet = (href: string) => {
    return async () => {
      if (getStatus(href) === Status.idle) {
        let map = new Map(statusByMagnet);
        map.set(href, Status.loading);
        setStatusByMagnet(map);
        const { success } = await postTorrents(href);
        map = new Map(map);
        map.set(href, success ? Status.success : Status.error);
        setStatusByMagnet(map);
      }
    };
  };

  const getStatus = (href: string): Status => {
    return statusByMagnet.get(href) || Status.idle;
  };

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (tabs[0]) {
        let url = tabs[0].url;
        currentTabUrl = url || ";";
        setUrl(currentTabUrl);
      }
    });

    chrome.runtime.onMessage.addListener((mssg) => {
      const body = document.createElement("body");
      body.innerHTML = mssg || "";
      // @ts-ignore
      activeTabDomRef.current = body;
      setMagnetList(scrapeLinkFromElement(body));
    });

    getActiveTabDom();
  }, []);

  const list = magnetList || [];
  const magnetMap = new Map(list.map((info) => [info.href, info]));
  const uniqueMagnetList = [...magnetMap.values()];

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
            {
              from && to && <>
              from <u>{from}</u> to <u>{to}</u>
              </>
            }
          </header>
          {uniqueMagnetList.map(({ title, href }) => {
            return (
              <div className="magnet-entry" key={href}>
                <div className="title">{title}</div>
                <div><i onClick={getOnClickMagnet(href)} className={`fa ${STATUS[getStatus(href)]}`} /></div>
              </div>
            );
          })}
        </div>
      )}
      {
        uniqueMagnetList.length === 0 && <div className="empty">No results</div>
      }
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
