import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";

// Main function
export function extractSmartContent(html, options = {}) {
  const doc = parseDocument(html);

  // Configurable blacklist
  const defaultTags = ['header', 'footer', 'nav', 'aside', 'form', 'button', 'script', 'style', '[role*="dialog"]'];
  const defaultClasses = ['nav', 'footer', 'header', 'popup', 'sidebar', 'comments', 'related', 'newsletter', 'speechify-ignore', 'breadcrumbs', 'csol-breadcrumbs'];

  const tagBlacklist = new Set([...(options.tagBlacklist || []), ...defaultTags]);
  const classBlacklist = [...(options.classBlacklist || []), ...defaultClasses];

  // Filter logic
  const isBlacklisted = (el) => {
    const name = el.name?.toLowerCase();
    const cls = el.attribs?.class?.toLowerCase() || '';
    const id = el.attribs?.id?.toLowerCase() || '';
    return (
      tagBlacklist.has(name) ||
      classBlacklist.some(b => cls.includes(b)) ||
      classBlacklist.some(b => id.includes(b))
    );
  };

  // Recursively clean unwanted nodes
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

  // Try finding the best <article> or <div> based on scoring
  const candidates = [
    ...DomUtils.getElementsByTagName('article', doc, true),
    ...DomUtils.getElementsByTagName('div', doc, true)
  ];

  let bestNode = null;
  let bestScore = 0;

  for (const node of candidates) {
    const score = scoreContentNode(node);
    if (score > bestScore) {
      bestScore = score;
      bestNode = node;
    }
  }

  // Return cleaned text from best node
  if (bestNode && bestScore > 20) {
    const text = DomUtils.getText(bestNode).trim();
    if (text.length > 200) return cleanText(text);
  }

  // Fallback: get all <p> elements
  const paragraphs = DomUtils.find(el => el.name === 'p', doc.children, true);
  const joined = paragraphs.map(p => DomUtils.getText(p).trim()).join("\n\n");
  return cleanText(joined);
}

// Scoring logic: favors dense, paragraph-rich content
function scoreContentNode(node) {
  const text = DomUtils.getText(node).trim();
  const pCount = DomUtils.getElementsByTagName('p', node, true).length;
  const tagCount = DomUtils.getElementsByTagName('*', node, true).length;

  if (!text || tagCount === 0) return 0;

  const density = text.length / tagCount;
  return density + pCount * 2; // Paragraphs are weighted higher
}

// Clean up text from HTML artifacts
function cleanText(text) {
  return text
    .replace(/\n{2,}/g, '\n\n')       // Collapse multiple newlines
    .replace(/\s{2,}/g, ' ')          // Remove extra spaces
    .replace(/&nbsp;/g, ' ')          // Convert HTML entities
    .trim();
}
