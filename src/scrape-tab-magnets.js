(function () {
  const aTagHrefs = [...document.querySelectorAll('a')].reduce((acc, a) => {
    if (a.href) {
      acc.push(a.href);
    }
    return acc;
  }, [])
  const iframeSources = [];
  document.querySelectorAll('iframe').forEach(iframe => {
    if (iframe.src) {
      iframeSources.push(iframe.src)
    }
  })
  // @ts-ignore
  chrome.runtime.sendMessage(undefined, JSON.stringify({ hrefs: aTagHrefs, iframeSources }));
})();
