import { extractSmartContent } from './smartExtractor';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return new Response(JSON.stringify({ error: "Missing ?url parameter" }), {
        status: 400,
        headers: corsHeaders()
      });
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
        headers: corsHeaders()
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to fetch or parse the page" }), {
        status: 500,
        headers: corsHeaders()
      });
    }
  }
};

function extractTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match ? match[1].trim() : "Untitled";
}

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };
}
