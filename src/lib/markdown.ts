import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

/** Markdown -> sanitised HTML. Raw HTML in Markdown is dropped (not rendered). */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize, { ...defaultSchema, clobberPrefix: "" })
  .use(rehypeStringify);

export function renderMarkdown(md: string): string {
  const html = String(processor.processSync(md));
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
