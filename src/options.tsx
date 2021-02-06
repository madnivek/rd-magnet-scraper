import React, {
  useEffect,
  useState,
  ChangeEventHandler,
  FunctionComponent,
} from "react";
import ReactDOM from "react-dom";
import { RD_API_KEY_KEY } from "./constants";
import "./options.scss";

const Options: FunctionComponent = () => {
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

  if (savedApiKey === undefined) {
    return null;
  }

  if (savedApiKey) {
    return (
      <div className="api-key-saved">
        <div>API Token Saved!</div>
        <span
          onClick={() => {
            setApiKey('')
            setSavedApiKey('');
          }}
        >
          reset token
        </span>
      </div>
    );
  }

  return (
    <div className="options-container">
      <form onSubmit={handleSubmitApiKey}>
        <input placeholder="Enter Private API Token" onChange={handleChangeApiKey} type="password" value={apiKey} />
        <button type="submit">save api key</button>
      </form>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
  document.getElementById("root")
);
