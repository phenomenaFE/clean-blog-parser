import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";

// ... (الكود كامل كما كتبته في الرسالة الأخيرة)

export function extractSmartContent(html) {
  const doc = parseDocument(html);

  // Step 1: remove blacklisted elements
  const blacklist = ['header', 'footer', 'nav', 'aside', 'form', 'button', 'script', 'style','[role*="dialog"]',"breadcrumbs_module"];
  const blacklistClasses = ['nav', 'footer', 'header', 'popup', 'sidebar', 'comments', 'related', 'newsletter','speechify-ignore','csol-breadcrumbs '];

  const isBlacklisted = (el) => {
    const name = el.name?.toLowerCase();
    const cls = el.attribs?.class?.toLowerCase() || '';
    const id = el.attribs?.id?.toLowerCase() || '';
    return (
      blacklist.includes(name) ||
      blacklistClasses.some(b => cls.includes(b)) ||
      blacklistClasses.some(b => id.includes(b))
    );
  };

  const cleanTree = (nodes) => {
    return nodes
      .filter(el => !isBlacklisted(el))
      .map(el => {
        if (el.children?.length) {
          el.children = cleanTree(el.children);
        }
        return el;
      });
  };

  doc.children = cleanTree(doc.children);

  // Step 2: find best div
  const allDivs = DomUtils.getElementsByTagName('div', doc, true);
  let best = null;
  let maxP = 0;

  for (let el of allDivs) {
    const pTags = DomUtils.getElementsByTagName('p', el, true);
    if (pTags.length > maxP) {
      maxP = pTags.length;
      best = el;
    }
  }

  if (best && maxP > 3) {
    const text = DomUtils.getText(best).trim();
    if (text.length > 200) return cleanText(text);
  }

  // fallback
  const paragraphs = DomUtils.find(el => el.name === 'p', doc.children, true);
  const joined = paragraphs.map(p => DomUtils.getText(p).trim()).join("\n\n");
  return cleanText(joined);
}

function cleanText(text) {
  return text
    .replace(/\n{2,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
