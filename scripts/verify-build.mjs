#!/usr/bin/env node
/**
 * Post-build checks that unit tests structurally cannot cover (TC_027, TC_028).
 *
 * branding.json is fetched at runtime, so a wrong base path fails ONLY in
 * production — and fails silently, falling back to defaults. This asserts the
 * built artefact requests the right URL before it ever reaches Pages.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const base = process.env.BASE_PATH
  ? process.env.BASE_PATH.endsWith("/")
    ? process.env.BASE_PATH
    : `${process.env.BASE_PATH}/`
  : "/";

const failures = [];
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => {
  failures.push(m);
  console.error(`  ✗ ${m}`);
};

console.log(`Verifying build output (base: ${base})\n`);

// TC_027 — the asset must actually ship
if (existsSync(join(DIST, "branding.json"))) {
  pass("branding.json is present in dist/");
} else {
  fail("branding.json is missing from dist/");
}

// TC_027 — and be valid
try {
  const brand = JSON.parse(readFileSync(join(DIST, "branding.json"), "utf8"))?.brand;
  if (brand?.organizationName) {
    pass(`branding.json parses (${brand.organizationName})`);
  } else {
    fail("branding.json has no brand.organizationName");
  }
} catch (err) {
  fail(`branding.json is not valid JSON: ${err.message}`);
}

// TC_027 / TC_028 — the bundle must request the correctly-joined URL
const assets = join(DIST, "assets");
const bundles = existsSync(assets)
  ? readdirSync(assets).filter((f) => f.endsWith(".js"))
  : [];
const js = bundles.map((f) => readFileSync(join(assets, f), "utf8")).join("\n");

const expected = `${base}branding.json`;
if (js.includes(expected)) {
  pass(`bundle requests ${expected}`);
} else {
  fail(`bundle does not request ${expected}`);
}

// The exact defect this guards: a base path with no trailing slash concatenates
// into '/gemma-ai-chatbot-reactbranding.json'.
// Only meaningful for a subpath deploy: at base '/' the squashed form is a
// substring of the correct URL, which would false-positive.
const squashed = `${base.replace(/\/$/, "")}branding.json`;
if (base === "/") {
  pass("root base path — missing-slash check not applicable");
} else if (js.includes(squashed)) {
  fail(`bundle requests the missing-slash path ${squashed}`);
} else {
  pass("no missing-slash concatenation in the bundle");
}

// Key presence is reported always, and enforced only when the build is meant
// to be keyless (EXPECT_NO_KEY=1). The Pages deploy embeds a key on purpose;
// the CI build must not.
const hasKey = /AQ\.[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,}/.test(js);
if (process.env.EXPECT_NO_KEY === "1") {
  if (hasKey) {
    fail("an API key literal appears in a build that must be keyless");
  } else {
    pass("no API key literal in the bundle");
  }
} else if (hasKey) {
  console.log("  ! an API key literal is embedded in this bundle and will be");
  console.log("    readable by anyone who loads the deployed site");
} else {
  pass("no API key literal in the bundle");
}

console.log();
if (failures.length) {
  console.error(`${failures.length} build check(s) failed.`);
  process.exit(1);
}
console.log("All build checks passed.");
