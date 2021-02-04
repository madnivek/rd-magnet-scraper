import qs from "qs";
import cheerio from "cheerio";
import { RD_API_KEY_KEY } from "./constants";

let RD_API_KEY = '';
chrome.storage.local.get([RD_API_KEY_KEY], ({ RD_API_KEY: key }) => {
  RD_API_KEY = key;
})

const magnetRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]*/g;

export interface MagnetInfo {
  href: string;
  title: string;
}

const scrapeLinkFromElement = (el: HTMLElement) => {
  const magnetLinks: MagnetInfo[] = [];
  el.querySelectorAll("a").forEach((el) => {
    let { href, title } = el;
    if (href) {
      const matches = href.match(magnetRegex);
      if (matches && matches[0]) {
        const params = qs.parse(href);
        if (typeof params.dn === "string") {
          title = params.dn;
        }
        magnetLinks.push({ href: matches[0], title });
      }
    }
  });
  return magnetLinks;
};

const scrapeLinkFromUrl = async (
  url: string
): Promise<{ success: boolean; magnetLinks?: MagnetInfo[] }> => {
  try {
    const magnetLinks: MagnetInfo[] = [];
    const getRes = await fetch(url);
    const html = await getRes.text();
    const $ = cheerio.load(html);
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      let title = $(el).attr("title") || "unknown file name";
      if (href) {
        const matches = href.match(magnetRegex);
        if (matches && matches[0]) {
          const params = qs.parse(href);
          if (typeof params.dn === "string") {
            title = params.dn;
          }
          magnetLinks.push({ href: matches[0], title });
        }
      }
    });
    return { success: true, magnetLinks };
  } catch {
    return { success: false };
  }
};

const getScrapedMagnets: (opts: {
  url: string;
  from?: number;
  to?: number;
}) => Promise<MagnetInfo[]> = async ({ url, from, to }) => {
  let magnetLinks: MagnetInfo[] = [];
  if (from !== undefined && to !== undefined && from < to) {
    const promises = [];
    for (let i = from; i <= to; i += 1) {
      promises.push(scrapeLinkFromUrl(`${url}${i}`));
    }
    const promiseRes = await Promise.all(promises);
    promiseRes.forEach(({ magnetLinks: links }) => {
      if (links) {
        magnetLinks = [...magnetLinks, ...links];
      }
    });
  } else {
    const linkRes = await scrapeLinkFromUrl(url);
    if (linkRes.magnetLinks) {
      magnetLinks = [...magnetLinks, ...linkRes.magnetLinks];
    }
  }
  return magnetLinks;
};

const postTorrents = async (magnet: string): Promise<{ success: boolean }> => {
  const headers = {
    Authorization: `Bearer ${RD_API_KEY}`,
  };
  try {
    const addMagnetRes = await fetch(
      "https://api.real-debrid.com/rest/1.0/torrents/addMagnet",
      {
        method: "POST",
        headers,
        body: new URLSearchParams({ magnet }),
      }
    );
    const { id } = await addMagnetRes.json();
    const selectFilesRes = await fetch(
      `https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${id}`,
      {
        method: "POST",
        headers,
        body: new URLSearchParams({ files: "all" }),
      }
    );
    return { success: true };
  } catch (e) {
    return { success: false };
  }
};

export {
  getScrapedMagnets,
  postTorrents,
  scrapeLinkFromElement,
  scrapeLinkFromUrl,
};
