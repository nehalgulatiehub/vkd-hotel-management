import { format } from "date-fns";

export const DISPLAY_DATE_FORMAT = "dd/MM/yyyy";

export function parseDisplayDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const dateStr = String(value).trim();

  const dmy = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;

    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day) {
      return parsed;
    }
    return null;
  }

  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day) {
      return parsed;
    }
    return null;
  }

  return null;
}

export function formatDisplayDate(value: string | Date | null | undefined, fallback = "-") {
  const parsed = parseDisplayDate(value);
  return parsed ? format(parsed, DISPLAY_DATE_FORMAT) : fallback;
}

export function replaceIsoDatesInText(text: string) {
  return text.replace(/\b(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?\b/g, (match) => {
    return formatDisplayDate(match, match);
  });
}

export function startIsoDateAutoFormatter() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const shouldSkip = (node: Node) => {
    const parent = node.parentElement;
    return !parent || Boolean(parent.closest("script, style, textarea, input, [data-keep-iso-date]"));
  };

  const formatTextNode = (node: Node) => {
    if (node.nodeType !== Node.TEXT_NODE || shouldSkip(node)) return;
    const current = node.textContent || "";
    if (!/\d{4}-\d{2}-\d{2}/.test(current)) return;
    const next = replaceIsoDatesInText(current);
    if (next !== current) node.textContent = next;
  };

  const walk = (root: Node) => {
    if (root.nodeType === Node.TEXT_NODE) {
      formatTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      formatTextNode(node);
      node = walker.nextNode();
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(walk);
      if (mutation.type === "characterData") formatTextNode(mutation.target);
    }
  });

  const start = () => {
    walk(document.body);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}