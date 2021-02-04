import React, { useEffect, useState, ChangeEventHandler, FunctionComponent } from "react";
import ReactDOM from "react-dom";
import { RD_API_KEY_KEY } from "./constants";

const Options: FunctionComponent = () => {
  const [savedApiKey, setSavedApiKey] = useState<string>();
  const [apiKey, setApiKey] = useState<string>('');

  const handleChangeApiKey: ChangeEventHandler<HTMLInputElement> = e => {
    setApiKey(e.target.value)
  }

  const handleSubmitApiKey = () => {
    setSavedApiKey(undefined);
    chrome.storage.local.set({ [RD_API_KEY_KEY]: apiKey }, () => {
      setSavedApiKey(apiKey);
    });
  }

  useEffect(() => {
    try {
      chrome.storage.local.get([RD_API_KEY_KEY], res => {
        setSavedApiKey(res.RD_API_KEY_KEY);
      })
    } catch (e) {
      console.log(e);
    }
    
  }, []);

  return <div className="options-container">
    <form onSubmit={handleSubmitApiKey}>
      <label>
        Private RD Api Key:
        <input onChange={handleChangeApiKey} type="password" value={apiKey} />
      </label>
      <button type="submit">
        save api key
      </button>
    </form>
  </div>
};

ReactDOM.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
  document.getElementById("root")
);
