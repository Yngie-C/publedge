import type { Book, Chapter } from "@/types";

// ── Minimal ZIP builder (no external dependency) ──────────────────────────

// CRC-32 table
const crcTable = (() => {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table.push(c);
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16LE(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
}

function uint32LE(n: number): Uint8Array {
  return new Uint8Array([
    n & 0xff,
    (n >> 8) & 0xff,
    (n >> 16) & 0xff,
    (n >> 24) & 0xff,
  ]);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

const encoder = new TextEncoder();
const enc = (s: string) => encoder.encode(s);

// DOS date/time for a fixed timestamp (2024-01-01 00:00:00)
const DOS_TIME = 0x0000;
const DOS_DATE = 0x5421; // 2024-01-01

interface ZipEntry {
  name: string;
  data: Uint8Array;
  method: 0 | 8; // 0=stored, 8=deflate (we use stored for simplicity)
}

function buildZip(entries: ZipEntry[]): Buffer {
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  const offsets: number[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = enc(entry.name);
    const data = entry.data;
    const crc = crc32(data);
    const size = data.length;

    offsets.push(offset);

    // Local file header
    const localHeader = concat(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // signature
      uint16LE(20),          // version needed
      uint16LE(0),           // flags
      uint16LE(0),           // compression (stored)
      uint16LE(DOS_TIME),
      uint16LE(DOS_DATE),
      uint32LE(crc),
      uint32LE(size),        // compressed
      uint32LE(size),        // uncompressed
      uint16LE(nameBytes.length),
      uint16LE(0),           // extra length
      nameBytes,
      data,
    );

    localHeaders.push(localHeader);
    offset += localHeader.length;

    // Central directory header
    const centralHeader = concat(
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]), // signature
      uint16LE(20),          // version made by
      uint16LE(20),          // version needed
      uint16LE(0),           // flags
      uint16LE(0),           // compression
      uint16LE(DOS_TIME),
      uint16LE(DOS_DATE),
      uint32LE(crc),
      uint32LE(size),
      uint32LE(size),
      uint16LE(nameBytes.length),
      uint16LE(0),           // extra length
      uint16LE(0),           // comment length
      uint16LE(0),           // disk start
      uint16LE(0),           // internal attrs
      uint32LE(0),           // external attrs
      uint32LE(offsets[offsets.length - 1]),
      nameBytes,
    );

    centralHeaders.push(centralHeader);
  }

  const centralDir = concat(...centralHeaders);
  const centralOffset = offset;
  const centralSize = centralDir.length;

  // End of central directory
  const eocd = concat(
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]), // signature
    uint16LE(0),             // disk number
    uint16LE(0),             // central dir disk
    uint16LE(entries.length),
    uint16LE(entries.length),
    uint32LE(centralSize),
    uint32LE(centralOffset),
    uint16LE(0),             // comment length
  );

  const allParts = concat(...localHeaders, centralDir, eocd);
  return Buffer.from(allParts);
}

// ── XML/HTML escaping ─────────────────────────────────────────────────────

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Sanitize HTML for XHTML (close self-closing tags, fix common issues)
function toXhtml(html: string): string {
  if (!html) return "<p></p>";
  return html
    // Self-closing tags
    .replace(/<br\s*\/?>/gi, "<br/>")
    .replace(/<hr\s*\/?>/gi, "<hr/>")
    .replace(/<img([^>]*?)(?<!\/)>/gi, "<img$1/>")
    // Ensure paragraphs are closed (basic pass)
    .replace(/&(?![a-zA-Z0-9#]{1,10};)/g, "&amp;");
}

// ── EPUB file templates ────────────────────────────────────────────────────

function mimetypeFile(): string {
  return "application/epub+zip";
}

function containerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

function contentOpf(book: Book, chapters: Chapter[], authorName: string): string {
  const now = new Date().toISOString().slice(0, 10);
  const manifestItems = chapters
    .map(
      (ch, i) =>
        `    <item id="chapter${i + 1}" href="chapters/chapter-${i + 1}.xhtml" media-type="application/xhtml+xml"/>`,
    )
    .join("\n");

  const spineItems = chapters
    .map((_, i) => `    <itemref idref="chapter${i + 1}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" xml:lang="${book.language || "ko"}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="book-id">urn:uuid:${book.id}</dc:identifier>
    <dc:title>${xmlEscape(book.title)}</dc:title>
    <dc:creator>${xmlEscape(authorName)}</dc:creator>
    <dc:language>${book.language || "ko"}</dc:language>
    <dc:date>${now}</dc:date>
    ${book.description ? `<dc:description>${xmlEscape(book.description)}</dc:description>` : ""}
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles/style.css" media-type="text/css"/>
${manifestItems}
  </manifest>
  <spine toc="ncx">
    <itemref idref="nav" linear="no"/>
${spineItems}
  </spine>
</package>`;
}

function tocNcx(book: Book, chapters: Chapter[], authorName: string): string {
  const navPoints = chapters
    .map(
      (ch, i) => `  <navPoint id="navpoint-${i + 1}" playOrder="${i + 1}">
    <navLabel><text>${xmlEscape(ch.title)}</text></navLabel>
    <content src="chapters/chapter-${i + 1}.xhtml"/>
  </navPoint>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx version="2005-1" xmlns="http://www.daisy.org/z3986/2005/ncx/">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${book.id}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${xmlEscape(book.title)}</text></docTitle>
  <docAuthor><text>${xmlEscape(authorName)}</text></docAuthor>
  <navMap>
${navPoints}
  </navMap>
</ncx>`;
}

function navXhtml(book: Book, chapters: Chapter[]): string {
  const navItems = chapters
    .map(
      (ch, i) =>
        `      <li><a href="chapters/chapter-${i + 1}.xhtml">${xmlEscape(ch.title)}</a></li>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${book.language || "ko"}">
<head>
  <meta charset="UTF-8"/>
  <title>목차 - ${xmlEscape(book.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>목차</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`;
}

function chapterXhtml(book: Book, chapter: Chapter, index: number): string {
  const body = toXhtml(chapter.content_html || `<p>${xmlEscape(chapter.content_raw || "")}</p>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${book.language || "ko"}">
<head>
  <meta charset="UTF-8"/>
  <title>${xmlEscape(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles/style.css"/>
</head>
<body>
  <section epub:type="chapter" id="chapter-${index + 1}">
    <h1 class="chapter-title">${xmlEscape(chapter.title)}</h1>
    <div class="chapter-content">
${body}
    </div>
  </section>
</body>
</html>`;
}

function styleCss(): string {
  return `/* EPUB stylesheet */
body {
  font-family: "Noto Serif", "Source Han Serif", Georgia, serif;
  font-size: 1em;
  line-height: 1.75;
  color: #1a1a1a;
  margin: 0;
  padding: 0;
}

h1.chapter-title {
  font-size: 1.8em;
  font-weight: bold;
  margin: 2em 0 1em;
  border-bottom: 1px solid #e5e5e5;
  padding-bottom: 0.5em;
  line-height: 1.3;
}

.chapter-content p {
  margin: 0 0 1em;
  text-align: justify;
  text-indent: 1em;
}

.chapter-content h1,
.chapter-content h2,
.chapter-content h3 {
  font-weight: bold;
  margin: 1.5em 0 0.75em;
  line-height: 1.3;
}

.chapter-content h1 { font-size: 1.5em; }
.chapter-content h2 { font-size: 1.3em; }
.chapter-content h3 { font-size: 1.1em; }

.chapter-content blockquote {
  border-left: 3px solid #ccc;
  margin: 1em 0 1em 1em;
  padding-left: 1em;
  color: #555;
  font-style: italic;
}

.chapter-content pre,
.chapter-content code {
  font-family: "Courier New", monospace;
  font-size: 0.9em;
  background: #f5f5f5;
}

.chapter-content pre {
  padding: 1em;
  overflow-x: auto;
  white-space: pre-wrap;
}

.chapter-content ul,
.chapter-content ol {
  margin: 1em 0;
  padding-left: 2em;
}

.chapter-content li {
  margin-bottom: 0.4em;
}

nav ol {
  list-style: none;
  padding: 0;
}

nav li {
  margin: 0.5em 0;
  border-bottom: 1px dotted #ccc;
  padding-bottom: 0.4em;
}

nav a {
  text-decoration: none;
  color: #333;
}

nav a:hover {
  color: #000;
}
`;
}

// ── Main export function ───────────────────────────────────────────────────

export async function generateEpub(
  book: Book,
  chapters: Chapter[],
  authorName: string,
): Promise<Buffer> {
  const entries: ZipEntry[] = [];

  const addEntry = (name: string, content: string) => {
    entries.push({ name, data: enc(content), method: 0 });
  };

  // mimetype MUST be the first entry and MUST be stored (not compressed)
  addEntry("mimetype", mimetypeFile());

  // META-INF
  addEntry("META-INF/container.xml", containerXml());

  // OEBPS
  addEntry("OEBPS/content.opf", contentOpf(book, chapters, authorName));
  addEntry("OEBPS/toc.ncx", tocNcx(book, chapters, authorName));
  addEntry("OEBPS/nav.xhtml", navXhtml(book, chapters));
  addEntry("OEBPS/styles/style.css", styleCss());

  // Chapters
  for (let i = 0; i < chapters.length; i++) {
    addEntry(
      `OEBPS/chapters/chapter-${i + 1}.xhtml`,
      chapterXhtml(book, chapters[i], i),
    );
  }

  return buildZip(entries);
}
