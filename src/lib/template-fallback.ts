/**
 * Replace interactive template blocks with static fallback HTML.
 * Must run BEFORE toXhtml() or stripHtmlForPdf().
 */
export function applyTemplateFallback(html: string): string {
  // Match <section data-template-type="...">...</section>
  // Use a regex that handles nested content (non-greedy, handles most cases)
  return html.replace(
    /<section\s+[^>]*data-template-type="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g,
    (match, type: string, inner: string) => {
      return convertToFallback(type, inner, match);
    }
  );
}

function getAttr(html: string, attr: string): string {
  const m = html.match(new RegExp(`${attr}="([^"]*)"`));
  return m ? m[1] : "";
}

function convertToFallback(type: string, inner: string, match: string): string {
  switch (type) {
    case "checklist": {
      const dataItems = getAttr(match, "data-items");
      if (dataItems) {
        try {
          const items: Array<{ text: string; checked?: boolean }> = JSON.parse(
            decodeURIComponent(dataItems)
          );
          const listItems = items
            .map((item) => `<li>${item.checked ? "☑" : "☐"} ${item.text}</li>`)
            .join("\n");
          return `<ul>\n${listItems}\n</ul>`;
        } catch {
          // fall through to inner content preservation
        }
      }
      // Fallback: extract text from inner HTML
      const textItems = inner
        .match(/<li[^>]*>([\s\S]*?)<\/li>/g)
        ?.map((li) => `<li>☐ ${li.replace(/<[^>]+>/g, "").trim()}</li>`)
        .join("\n");
      return textItems ? `<ul>\n${textItems}\n</ul>` : inner;
    }

    case "callout": {
      const calloutType = getAttr(match, "data-callout-type") || "info";
      const prefixMap: Record<string, string> = {
        info: "ℹ️",
        warning: "⚠️",
        tip: "💡",
        note: "📝",
      };
      const prefix = prefixMap[calloutType] || "ℹ️";
      const text = inner.replace(/<[^>]+>/g, "").trim();
      return `<blockquote>${prefix} ${text}</blockquote>`;
    }

    case "reflection": {
      const question = inner.replace(/<[^>]+>/g, "").trim();
      return `<p><strong>${question}</strong></p>\n<p>여기에 답변을 작성하세요</p>`;
    }

    case "toggle": {
      const titleMatch = inner.match(/<[^>]+[^/]>([\s\S]*?)<\/[^>]+>/);
      const title = titleMatch
        ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
        : "";
      const contentMatch = inner.match(/<div[^>]*>([\s\S]*?)<\/div>/);
      const content = contentMatch ? contentMatch[0] : inner;
      return `<p><strong>${title}</strong></p>\n${content}`;
    }

    case "column-list": {
      const items = inner
        .match(/<[^>]+>([\s\S]*?)<\/[^>]+>/g)
        ?.map((item) => `<li>${item.replace(/<[^>]+>/g, "").trim()}</li>`)
        .filter((li) => li !== "<li></li>")
        .join("\n");
      return items ? `<ul>\n${items}\n</ul>` : `<ul><li>${inner.replace(/<[^>]+>/g, "").trim()}</li></ul>`;
    }

    case "smart-goal": {
      const labels = [
        ["S", "Specific (구체적)"],
        ["M", "Measurable (측정 가능)"],
        ["A", "Achievable (달성 가능)"],
        ["R", "Relevant (관련성)"],
        ["T", "Time-bound (기한)"],
      ];
      const rows = labels
        .map(([letter, label]) => `<tr><td><strong>${letter}</strong> ${label}</td><td></td></tr>`)
        .join("\n");
      return `<table>\n<tbody>\n${rows}\n</tbody>\n</table>`;
    }

    case "before-after": {
      const sections = inner.split(/<hr[^>]*\/?>/i);
      const before = sections[0]?.replace(/<[^>]+>/g, "").trim() || "";
      const after = sections[1]?.replace(/<[^>]+>/g, "").trim() || "";
      return (
        `<p><strong>Before:</strong></p>\n<p>${before}</p>\n` +
        `<p><strong>After:</strong></p>\n<p>${after}</p>`
      );
    }

    case "scale": {
      const labelMin = getAttr(match, "data-label-min") || "";
      const labelMax = getAttr(match, "data-label-max") || "";
      const minPart = labelMin ? `[${labelMin}] ` : "";
      const maxPart = labelMax ? ` [${labelMax}]` : "";
      return `<p>스케일: ${minPart}1-10${maxPart}</p>`;
    }

    case "quadrant": {
      const labelX = getAttr(match, "data-label-x") || "X축";
      const labelY = getAttr(match, "data-label-y") || "Y축";
      const dataItems = getAttr(match, "data-items");
      let cells: string[] = ["", "", "", ""];
      if (dataItems) {
        try {
          const items: Array<{ text: string }> = JSON.parse(
            decodeURIComponent(dataItems)
          );
          cells = items.map((item) => item.text || "");
        } catch {
          // keep empty cells
        }
      }
      const [q1, q2, q3, q4] = cells;
      return (
        `<p><strong>${labelY} / ${labelX}</strong></p>\n` +
        `<table>\n<tbody>\n` +
        `<tr><td><strong>Q1</strong><br>${q1}</td><td><strong>Q2</strong><br>${q2}</td></tr>\n` +
        `<tr><td><strong>Q3</strong><br>${q3}</td><td><strong>Q4</strong><br>${q4}</td></tr>\n` +
        `</tbody>\n</table>`
      );
    }

    case "okr": {
      const objective = getAttr(match, "data-objective") || "";
      const dataKr = getAttr(match, "data-key-results");
      let krItems = "";
      if (dataKr) {
        try {
          const krs: Array<{ text: string; progress: number }> = JSON.parse(
            decodeURIComponent(dataKr)
          );
          krItems = krs
            .map((kr) => `<li>${kr.text} (${kr.progress ?? 0}%)</li>`)
            .join("\n");
        } catch {
          // keep empty
        }
      }
      return (
        `<p><strong>Objective:</strong> ${objective}</p>\n` +
        (krItems ? `<ul>\n${krItems}\n</ul>` : "")
      );
    }

    case "habit-tracker": {
      const dataHabits = getAttr(match, "data-habits");
      if (dataHabits) {
        try {
          const habits: Array<{ name: string; checks: boolean[] }> = JSON.parse(
            decodeURIComponent(dataHabits)
          );
          const headerCols = ["월", "화", "수", "목", "금", "토", "일"]
            .map((d) => `<th>${d}</th>`)
            .join("");
          const rows = habits
            .map((h) => {
              const dayCells = Array.from({ length: 7 }, (_, i) =>
                `<td>${h.checks?.[i] ? "☑" : "☐"}</td>`
              ).join("");
              return `<tr><td>${h.name}</td>${dayCells}</tr>`;
            })
            .join("\n");
          return (
            `<table>\n<thead><tr><th>습관</th>${headerCols}</tr></thead>\n` +
            `<tbody>\n${rows}\n</tbody>\n</table>`
          );
        } catch {
          // fall through
        }
      }
      return inner;
    }

    case "woop": {
      const dataFields = getAttr(match, "data-fields");
      let fields: Record<string, string> = { w: "", o: "", ob: "", p: "" };
      if (dataFields) {
        try {
          fields = JSON.parse(decodeURIComponent(dataFields)) as Record<string, string>;
        } catch {
          // keep defaults
        }
      }
      const labels: Array<[string, string]> = [
        ["Wish", fields.w || ""],
        ["Outcome", fields.o || ""],
        ["Obstacle", fields.ob || ""],
        ["Plan", fields.p || ""],
      ];
      return labels
        .map(([label, text]) => `<p><strong>${label}:</strong> ${text}</p>`)
        .join("\n");
    }

    default: {
      // Remove data-* attributes from the section tag but preserve inner HTML
      return match.replace(/<section\s+[^>]*>/, "<div>").replace(/<\/section>$/, "</div>");
    }
  }
}
