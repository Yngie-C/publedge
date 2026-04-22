const PREFIX = "publedge_template";

function buildKey(chapterId: string, nodeId: string): string {
  return `${PREFIX}_${chapterId}_${nodeId}`;
}

export function getTemplateState<T>(chapterId: string, nodeId: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(buildKey(chapterId, nodeId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setTemplateState<T>(chapterId: string, nodeId: string, state: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(buildKey(chapterId, nodeId), JSON.stringify(state));
  } catch {
    // quota exceeded — silently ignore
  }
}

export function clearTemplateState(chapterId: string, nodeId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(buildKey(chapterId, nodeId));
}
