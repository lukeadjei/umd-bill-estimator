import * as cheerio from "cheerio";

// Shared by every page-fetching function -- plain HTTP GET, no headless
// browser. Only works because every target page is server-rendered (data is
// present in the raw HTML response, confirmed via View Source before picking
// this approach over something like Puppeteer).
export async function fetchAndLoad(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  return cheerio.load(html);
}
