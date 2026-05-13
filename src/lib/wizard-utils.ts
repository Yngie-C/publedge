// Shared wizard utilities — used by both /create and /create/wizard pages.
// Do NOT import from page components to avoid cross-page bundling issues.

const WIZARD_COMPLETED_KEY = "publedge_wizard_completed";

export function markWizardCompleted() {
  try {
    localStorage.setItem(WIZARD_COMPLETED_KEY, "1");
  } catch {
    // ignore
  }
}

export function isWizardCompleted(): boolean {
  try {
    return localStorage.getItem(WIZARD_COMPLETED_KEY) === "1";
  } catch {
    return false;
  }
}
