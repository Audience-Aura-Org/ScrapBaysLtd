import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

type HNode = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: HNode[] };
const isWs = (n: HNode) => n.type === "text" && !n.value?.trim();
const textOf = (n: HNode): string => (n.type === "text" ? n.value || "" : (n.children || []).map(textOf).join(""));
/** A paragraph that contains nothing but one image. */
const loneImage = (n: HNode) => {
  if (n.type !== "element" || n.tagName !== "p") return null;
  const kids = (n.children || []).filter((c) => !isWs(c));
  return kids.length === 1 && kids[0].tagName === "img" ? kids[0] : null;
};

/**
 * Runs after sanitising, on trusted structure only:
 * - stand-alone images become <figure>; a short plain line right after one (how WordPress
 *   captions were imported) becomes its <figcaption>;
 * - an image identical to the page's featured image is dropped (it is already shown above).
 */
function rehypeFigures(options: { dropSrc?: string }) {
  return (tree: HNode) => {
    const out: HNode[] = [];
    const kids = tree.children || [];
    for (let i = 0; i < kids.length; i++) {
      const img = loneImage(kids[i]);
      if (!img) {
        out.push(kids[i]);
        continue;
      }
      // Find the next non-whitespace sibling: a short, link-free paragraph is a caption.
      let j = i + 1;
      while (j < kids.length && isWs(kids[j])) j++;
      const next = kids[j];
      const caption =
        next?.type === "element" && next.tagName === "p" && !(next.children || []).some((c) => c.type === "element") && textOf(next).trim().length <= 100
          ? textOf(next).trim()
          : null;
      if (caption) i = j;
      if (options.dropSrc && img.properties?.src === options.dropSrc) continue;
      out.push({
        type: "element",
        tagName: "figure",
        properties: {},
        children: [img, ...(caption ? [{ type: "element", tagName: "figcaption", properties: {}, children: [{ type: "text", value: caption }] }] : [])],
      });
    }
    tree.children = out;
  };
}

/** Markdown -> sanitised HTML. Raw HTML in Markdown is dropped (not rendered). */
const makeProcessor = (dropSrc?: string) =>
  unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize, { ...defaultSchema, clobberPrefix: "" })
    .use(rehypeFigures, { dropSrc })
    .use(rehypeStringify);
const processor = makeProcessor();

export function renderMarkdown(md: string, options: { dropImage?: string } = {}): string {
  const html = String((options.dropImage ? makeProcessor(options.dropImage) : processor).processSync(md));
  return html
    .replace(/<img /g, '<img loading="lazy" decoding="async" ')
    .replace(/<a href="(https?:\/\/(?!scrapbaysltd\.com)[^"]+)"/g, '<a href="$1" rel="noopener nofollow" target="_blank"')
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>");
}

/** Drop an opening "## Title" when it just repeats the page's <h1>. */
export function dropDuplicateTitle(md: string, title: string): string {
  const norm = (s: string) => s.replace(/[*_[\]]/g, "").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  const m = md.match(/^\s*#{1,3} (.+)\n+/);
  return m && norm(m[1]) === norm(title) ? md.slice(m[0].length) : md;
}

/** Plain-text summary for meta descriptions. */
export function summarize(md: string, max = 158): string {
  const text = md
    .replace(/^#{1,6} .*$/gm, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\|.*\|$/gm, " ")
    .replace(/[*_`>#|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "") + "…";
}
