import axe from "axe-core";
import { expect } from "vitest";

/**
 * Runs axe-core on a rendered container and fails with a readable list of violations.
 * Colour contrast is skipped: jsdom has no layout or CSS cascade, so that rule cannot give a real answer there.
 */
export async function expectNoA11yViolations(container: Element) {
  const { violations } = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  const summary = violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
  expect(summary).toEqual([]);
}
