import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "em", "strong", "ul", "ol", "li", "blockquote", "img", "a",
  "br", "hr", "table", "thead", "tbody", "tr", "th", "td",
  "pre", "code", "span", "div", "figure", "figcaption",
];

const ALLOWED_ATTR = ["href", "src", "alt", "class", "id"];

/** 서버 사이드: 챕터 저장 시 강제 sanitize */
export function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}

/** 클라이언트 사이드: 이중 방어 렌더링용 */
export function sanitizeForRender(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
