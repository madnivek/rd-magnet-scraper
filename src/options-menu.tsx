import React, {
  useEffect,
  useState,
  ChangeEventHandler,
  FunctionComponent,
} from "react";
import { RD_API_KEY_KEY } from "./constants";
import "./options.scss";

const OptionsMenu: FunctionComponent = () => {
  const [savedApiKey, setSavedApiKey] = useState<string>();
  const [apiKey, setApiKey] = useState<string>('');

  const handleChangeApiKey: ChangeEventHandler<HTMLInputElement> = (e) => {
    setApiKey(e.target.value);
  };

  const handleSubmitApiKey = () => {
    chrome.storage.local.set({ [RD_API_KEY_KEY]: apiKey }, () => {
      setSavedApiKey(apiKey || '');
    });
  };

  useEffect(() => {
    try {
      chrome.storage.local.get([RD_API_KEY_KEY], (res) => {
        setSavedApiKey(res[RD_API_KEY_KEY]);
      });
    } catch (e) {
      console.log(e);
    }
  }, []);

  if (savedApiKey) {
    return (
      <div id="options" className="options-container">
        <div className="api-key-saved grid-x grid-padding-x">
          <div className="cell auto">API Token Saved!</div>
          <span
            className="cell shrink"
            onClick={() => {
              setApiKey('')
              setSavedApiKey('');
            }}
          >
            reset token
          </span>
        </div>
      </div>
    );
  }

  const tokenHref = "https://real-debrid.com/apitoken";

  return (
    <div id="options">
      <form onSubmit={handleSubmitApiKey}>
        <p className="display-inline">
          Enter your <a href={tokenHref} target="_blank" rel="noopener noreferrer">API Token</a>:
        </p>
        <input placeholder="Enter Private API Token" onChange={handleChangeApiKey} type="password" value={apiKey} />
        <button type="submit">save api key</button>
      </form>
    </div>
  );
};

export default OptionsMenu;