import { extractSmartContent } from './smartExtractor';
import { parseDocument } from "htmlparser2";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return new Response("Missing ?url param", { status: 400 });
    }

    try {
      const res = await fetch(target);
      const html = await res.text();
      const title = extractTitle(html);
      const content = extractSmartContent(html);

      return new Response(JSON.stringify({
        url: target,
        title,
        content,
        length: content.length,
        source: new URL(target).hostname
      }, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response("Failed to fetch or parse the page", { status: 500 });
    }
  }
}

function extractTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match ? match[1].trim() : "Untitled";
}
