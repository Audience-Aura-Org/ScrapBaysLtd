import "server-only";
import { getPosts } from "./content";

// Matches the old WordPress blog (10 posts per page, /blog/page/N/).
export const POSTS_PER_PAGE = 10;
export const blogPageCount = () => Math.max(1, Math.ceil(getPosts().length / POSTS_PER_PAGE));
export const blogPage = (n: number) => getPosts().slice((n - 1) * POSTS_PER_PAGE, n * POSTS_PER_PAGE);
export const blogHref = (n: number) => (n <= 1 ? "/blog/" : `/blog/page/${n}/`);
