import qs from "qs";
import cheerio from "cheerio";

export const magnetRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]*/g;

export interface MagnetInfo {
  href: string;
  title: string;
}

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

export { getScrapedMagnets, scrapeLinkFromUrl };
