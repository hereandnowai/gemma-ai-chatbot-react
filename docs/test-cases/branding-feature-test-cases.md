# Test Cases — HERE AND NOW AI Branding Feature

| | |
| --- | --- |
| **Feature** | Apply HERE AND NOW AI branding from `branding.json` |
| **Traces to** | [Issue #1](https://github.com/hereandnowai/gemma-ai-chatbot-react/issues/1) |
| **Branch** | `feature/1-branding-info` |
| **Author** | Ruthran Raghavan |
| **Status** | Draft — pending review |

---

## 1. Assumptions

| # | Assumption | Needs validation? |
| --- | --- | --- |
| A1 | `public/branding.json` is served as a static asset and is **not** bundled, so it is fetched at runtime and subject to the deployment base path. | No — verified in build output |
| A2 | Logo and avatar images are hosted on `raw.githubusercontent.com`, a third party outside our control. They may fail, be slow, or 404 at any time. | No — confirmed in `branding.json` |
| A3 | `branding.json` is a trusted, repo-controlled file. It is **not** user-supplied, so injection is a low-likelihood but non-zero risk (a compromised repo or a bad merge). | Yes — see TC_022, TC_023 |
| A4 | The app is deployed to GitHub Pages at `/gemma-ai-chatbot-react/`, never at the domain root. | No — confirmed by Pages config |
| A5 | Brand colours are applied as CSS custom properties on `:root`, so styling remains declarative in CSS. | No — design decision |
| A6 | A branding failure must **never** prevent the chatbot from functioning. Branding is presentation; chat is the product. | Yes — product decision, confirm with owner |

---

## 2. Test Cases

### 2.1 Branding loader — `loadBranding()`

#### TC_001 — Loader requests branding.json relative to the deployment base path
- **Type**: Happy Path · **Priority**: High · **AC**: 3
- **Preconditions**: App built with `BASE_PATH=/gemma-ai-chatbot-react`
- **Steps**:
  1. Invoke `loadBranding()` with a stubbed fetch
  2. Capture the URL passed to fetch
- **Test Data**: `import.meta.env.BASE_URL = "/gemma-ai-chatbot-react/"`
- **Expected Result**: Fetch is called with exactly `/gemma-ai-chatbot-react/branding.json`. It is **not** called with `/branding.json` or `/gemma-ai-chatbot-reactbranding.json`.

#### TC_002 — Loader returns brand data when the file loads successfully
- **Type**: Happy Path · **Priority**: High · **AC**: 1
- **Preconditions**: None
- **Steps**:
  1. Stub fetch to resolve `{ok: true}` with a full brand payload
  2. Invoke `loadBranding()`
- **Test Data**: `{"brand": {"organizationName": "HERE AND NOW AI", "slogan": "AI is Good"}}`
- **Expected Result**: Returned object has `organizationName === "HERE AND NOW AI"` and `slogan === "AI is Good"`.

#### TC_003 — Loader merges a partial file over defaults
- **Type**: Edge · **Priority**: High · **AC**: 1
- **Preconditions**: None
- **Steps**:
  1. Stub fetch to return a brand containing only `colors.primary`
  2. Invoke `loadBranding()`
- **Test Data**: `{"brand": {"colors": {"primary": "#123456"}}}`
- **Expected Result**: `colors.primary === "#123456"`; `colors.secondary === "#004040"` (from fallback); `slogan === "AI is Good"` (from fallback). No key is `undefined`.

#### TC_004 — Loader falls back when the file returns HTTP 404
- **Type**: Negative · **Priority**: High · **AC**: 5
- **Preconditions**: None
- **Steps**:
  1. Stub fetch to resolve `{ok: false, status: 404}`
  2. Invoke `loadBranding()`
- **Test Data**: HTTP 404
- **Expected Result**: Returns an object deep-equal to `FALLBACK_BRAND`. No exception is thrown.

#### TC_005 — Loader falls back when the network request rejects
- **Type**: Negative · **Priority**: High · **AC**: 5
- **Preconditions**: None
- **Steps**:
  1. Stub fetch to reject with `new Error("offline")`
  2. Invoke `loadBranding()`
- **Test Data**: Rejected promise
- **Expected Result**: Returns `FALLBACK_BRAND`. The rejection does not propagate.

#### TC_006 — Loader falls back when the response body is malformed JSON
- **Type**: Negative · **Priority**: High · **AC**: 5
- **Preconditions**: None
- **Steps**:
  1. Stub fetch to resolve `ok: true` with a `.json()` that throws `SyntaxError`
  2. Invoke `loadBranding()`
- **Test Data**: `"{ brand: "` (truncated JSON)
- **Expected Result**: Returns `FALLBACK_BRAND`. No exception escapes.

#### TC_007 — Loader falls back when valid JSON lacks the `brand` key
- **Type**: Edge · **Priority**: Medium · **AC**: 5
- **Preconditions**: None
- **Steps**:
  1. Stub fetch to return valid JSON with no `brand` property
  2. Invoke `loadBranding()`
- **Test Data**: `{"organizationName": "Wrong shape"}`
- **Expected Result**: Returns `FALLBACK_BRAND`, not a partially-populated object.

#### TC_008 — Loader falls back when `brand` is a non-object
- **Type**: Boundary · **Priority**: Medium · **AC**: 5
- **Preconditions**: None
- **Steps**:
  1. Stub fetch to return `{"brand": "HERE AND NOW AI"}`
  2. Invoke `loadBranding()`
- **Test Data**: `brand` as a string
- **Expected Result**: Returns `FALLBACK_BRAND`. Does not attempt to spread a string.

---

### 2.2 Social links — `toSocialLinks()`

#### TC_009 — Known networks receive human-readable labels
- **Type**: Happy Path · **Priority**: Medium · **AC**: 1
- **Preconditions**: None
- **Steps**: Call `toSocialLinks()` with two known networks
- **Test Data**: `{linkedin: "https://linkedin.com/company/hereandnowai/", x: "https://x.com/hereandnow_ai"}`
- **Expected Result**: Returns exactly `[{key:"linkedin", url:"…", label:"LinkedIn"}, {key:"x", url:"…", label:"X"}]`, in that order.

#### TC_010 — Empty-string URLs are excluded from the rendered list
- **Type**: Edge · **Priority**: Medium · **AC**: 1
- **Preconditions**: None
- **Steps**: Call `toSocialLinks()` with one empty and one populated entry
- **Test Data**: `{blog: "", github: "https://github.com/hereandnowai"}`
- **Expected Result**: Returns an array of length 1, containing only the `github` entry.

#### TC_011 — Missing socialMedia object returns an empty list, not a crash
- **Type**: Boundary · **Priority**: Medium · **AC**: 5
- **Preconditions**: None
- **Steps**: Call `toSocialLinks()` with no argument
- **Test Data**: `undefined`
- **Expected Result**: Returns `[]`. No `TypeError`.

#### TC_012 — Unknown network keys fall back to the raw key as the label
- **Type**: Edge · **Priority**: Low · **AC**: 1
- **Preconditions**: None
- **Steps**: Call `toSocialLinks()` with a key absent from the label map
- **Test Data**: `{mastodon: "https://mastodon.social/@hereandnowai"}`
- **Expected Result**: Returns one entry with `label === "mastodon"`. The link still renders.

---

### 2.3 Theming — `applyBrandColors()` / `applyFavicon()`

#### TC_013 — Brand colours are published as CSS custom properties
- **Type**: Happy Path · **Priority**: High · **AC**: 1
- **Preconditions**: A detached DOM element acting as root
- **Steps**:
  1. Call `applyBrandColors({primary, secondary}, root)`
  2. Read back both custom properties
- **Test Data**: `{primary: "#FFDF00", secondary: "#004040"}`
- **Expected Result**: `--brand-primary === "#FFDF00"` and `--brand-secondary === "#004040"` on the root element.

#### TC_014 — Absent colours leave existing values untouched
- **Type**: Negative · **Priority**: Medium · **AC**: 5
- **Preconditions**: Root already has `--brand-primary: #000000`
- **Steps**: Call `applyBrandColors({}, root)`
- **Test Data**: Empty colours object
- **Expected Result**: `--brand-primary` remains `#000000`. It is not cleared or set to `undefined`.

#### TC_015 — Favicon link element is created when the document has none
- **Type**: Edge · **Priority**: Low · **AC**: 1
- **Preconditions**: A document with no `link[rel=icon]`
- **Steps**: Call `applyFavicon(url, doc)`
- **Test Data**: `"https://example.com/icon.png"`
- **Expected Result**: A `link[rel="icon"]` exists in `head` with that exact `href`.

#### TC_016 — Empty favicon URL leaves the document unmodified
- **Type**: Boundary · **Priority**: Low · **AC**: 5
- **Preconditions**: A document with no `link[rel=icon]`
- **Steps**: Call `applyFavicon("", doc)`
- **Test Data**: `""`
- **Expected Result**: No `link[rel="icon"]` is created. The default favicon is retained.

---

### 2.4 Header component

#### TC_017 — Organisation name and slogan render from branding data
- **Type**: Happy Path · **Priority**: High · **AC**: 1, 2
- **Preconditions**: Header rendered with a full brand object
- **Steps**: Render `<Header brand={brand} />` and query for both strings
- **Test Data**: `organizationName: "HERE AND NOW AI"`, `slogan: "AI is Good"`
- **Expected Result**: Both strings are present in the document. Neither is hardcoded in the component source.

#### TC_018 — Brand logo renders with the organisation name as alt text
- **Type**: Happy Path · **Priority**: High · **AC**: 1
- **Preconditions**: Brand object contains `logo.title`
- **Steps**: Render Header and query by alt text
- **Test Data**: `logo.title = "https://example.com/logo.png"`
- **Expected Result**: An `img` exists whose `src` equals that URL and whose `alt` equals `"HERE AND NOW AI"`.

#### TC_019 — Broken logo degrades to a text mark without breaking the header
- **Type**: Negative · **Priority**: High · **AC**: 5
- **Preconditions**: Header rendered with a logo URL (per A2, the CDN may fail)
- **Steps**:
  1. Render Header
  2. Fire an `error` event on the logo image
- **Test Data**: Simulated image load failure
- **Expected Result**: The `img` is removed from the document; the organisation name remains visible. No blank or broken-image icon is shown.

#### TC_020 — New chat control is disabled when there is nothing to reset
- **Type**: Boundary · **Priority**: Medium · **AC**: —
- **Preconditions**: Conversation is empty (`canReset={false}`)
- **Steps**: Render Header and inspect the New chat button
- **Test Data**: `canReset = false`
- **Expected Result**: Button is present and has the `disabled` attribute.

---

### 2.5 Regression guards — existing behaviour must survive the rebrand

#### TC_021 — Assistant reasoning is never rendered to the user
- **Type**: Negative · **Priority**: **Critical** · **AC**: —
- **Preconditions**: None. *This guards a defect found in production testing.*
- **Steps**: Call `extractAnswerText()` with a payload mixing a `thought: true` part and an answer part
- **Test Data**: `{candidates:[{content:{parts:[{text:"Count: Hello (1)… let me reconsider", thought:true},{text:"Hello, nice to meet you."}]}}]}`
- **Expected Result**: Returns exactly `"Hello, nice to meet you."`. The reasoning text does not appear anywhere in the return value.

#### TC_022 — Assistant turns map to the API's `model` role
- **Type**: Happy Path · **Priority**: High · **AC**: —
- **Preconditions**: None
- **Steps**: Call `toContents()` with a three-turn conversation
- **Test Data**: `[user "hi", assistant "hello", user "who are you?"]`
- **Expected Result**: Roles are exactly `["user", "model", "user"]`. Silent breakage here corrupts conversation history.

#### TC_023 — Enter sends the message; Shift+Enter inserts a newline
- **Type**: Happy Path · **Priority**: High · **AC**: —
- **Preconditions**: Composer rendered, not streaming
- **Steps**: Type text, press Enter; separately type text, press Shift+Enter
- **Test Data**: `"hello"` + Enter; `"line one"` + Shift+Enter + `"line two"`
- **Expected Result**: Enter invokes `onSend("hello")`. Shift+Enter does **not** invoke `onSend`, and the textarea value becomes `"line one\nline two"`.

---

### 2.6 Security

#### TC_024 — External links cannot access the opener window
- **Type**: Security · **Priority**: High · **AC**: —
- **Preconditions**: Footer rendered with social links
- **Steps**: Render Footer and inspect every anchor with `target="_blank"`
- **Test Data**: Full `socialMedia` object from `branding.json`
- **Expected Result**: Every such anchor carries `rel` containing `noreferrer`. Without it, the destination can reach `window.opener` and redirect this tab (reverse tabnabbing).

#### TC_025 — A `javascript:` URL in branding data does not become an executable link
- **Type**: Security · **Priority**: Medium · **AC**: —
- **Preconditions**: Per A3, `branding.json` is trusted but a compromised repo or bad merge is possible
- **Steps**: Render Footer with a `javascript:` scheme in a social URL
- **Test Data**: `{blog: "javascript:alert(document.domain)"}`
- **Expected Result**: Clicking the link does not execute script. The scheme is rejected or neutralised rather than passed through to `href` unchanged.

#### TC_026 — Branding content is rendered as text, never as markup
- **Type**: Security · **Priority**: Medium · **AC**: —
- **Preconditions**: Brand object contains HTML in a text field
- **Steps**: Render Header with markup embedded in the slogan
- **Test Data**: `slogan: "<img src=x onerror=alert(1)>"`
- **Expected Result**: The literal string is displayed as visible text. No `img` element is created in the DOM.

---

### 2.7 Deployment integration

#### TC_027 — branding.json is reachable at the deployed base path
- **Type**: Happy Path · **Priority**: **Critical** · **AC**: 3
- **Preconditions**: Production build served under `/gemma-ai-chatbot-react/`
- **Steps**:
  1. Build with `BASE_PATH=/gemma-ai-chatbot-react`
  2. Serve the build
  3. Request `/gemma-ai-chatbot-react/branding.json`
- **Test Data**: Production build artefact
- **Expected Result**: HTTP 200, and the body parses to an object with a `brand` key.

#### TC_028 — The pre-fix concatenated path does not resolve
- **Type**: Negative · **Priority**: High · **AC**: 3
- **Preconditions**: Same as TC_027. *Guards a defect found during implementation.*
- **Steps**: Request `/gemma-ai-chatbot-reactbranding.json`
- **Test Data**: The malformed URL produced when the base path lacks a trailing slash
- **Expected Result**: HTTP 404, confirming the missing-slash defect is genuinely fixed rather than masked.

#### TC_029 — Text and background pairs meet WCAG AA contrast
- **Type**: Edge · **Priority**: High · **AC**: 4
- **Preconditions**: Brand palette applied
- **Steps**: Compute the WCAG 2.1 contrast ratio for each defined foreground/background pair
- **Test Data**: `#FFDF00`/`#004040`; `#052020`/`#FFDF00`; `#e6f2f0`/`#0e2a2a`; `#86a5a2`/`#0b2222`
- **Expected Result**: Every pair scores ≥ 4.5:1 for body text. Any pair below 4.5:1 must be restricted to large text and score ≥ 3.0:1.

---

## 3. Coverage Summary

| Category | Count |
| --- | --- |
| **Total test cases** | **29** |
| Happy Path | 9 |
| Negative | 8 |
| Edge | 6 |
| Boundary | 4 |
| Security | 3 (TC_024, TC_025, TC_026) |

**By priority** — Critical 2 · High 15 · Medium 8 · Low 4

**Acceptance-criteria traceability** (Issue #1)

| AC | Description | Covered by |
| --- | --- | --- |
| AC1 | Nothing hardcoded — all values from `branding.json` | TC_002, TC_003, TC_009, TC_012, TC_013, TC_015, TC_017, TC_018 |
| AC2 | Editing `branding.json` alone changes the UI | TC_017 |
| AC3 | Renders correctly on the deployed site | TC_001, TC_027, TC_028 |
| AC4 | WCAG AA contrast | TC_029 |
| AC5 | Graceful fallback on load failure | TC_004–TC_008, TC_011, TC_014, TC_016, TC_019 |
| AC6 | Unit tests cover the loader including failure paths | TC_001–TC_008 |

✅ All six acceptance criteria have at least one covering test case.

---

## 4. Risk-Based Insights

**Highest-risk areas, in order:**

1. **Base-path resolution (TC_001, TC_027, TC_028).** The only defect class that passes every local check and fails exclusively in production. `branding.json` is fetched at runtime, so a wrong path yields a *silent* fallback — the app looks fine, just unbranded, with no error anywhere. This already occurred once during implementation.

2. **Third-party image availability (TC_019).** Logo and avatar load from `raw.githubusercontent.com`, outside our control (A2). An outage or a moved file degrades the brand on every page view. Failure must be invisible to users.

3. **Reasoning leakage (TC_021).** Not a branding concern, but the branding work touched `gemini.js`. A regression here exposes the model's internal monologue to end users — the most visible possible defect in a chatbot.

4. **Silent fallback masking real breakage.** By design, every loader failure degrades quietly. That is correct for users and dangerous for us: nobody finds out branding is broken. **Recommendation:** log a console warning on fallback so the failure is at least discoverable in DevTools.

**Defect-prone areas:** string concatenation of URLs; remote image error handling; CSS custom-property cascade when values arrive after first paint (possible flash of fallback colours).

---

## 5. QA Review Checklist

**Assumptions needing validation**
- [ ] **A3** — Is `branding.json` ever to be edited outside a reviewed PR? If a CMS or non-engineer could write it, TC_025 and TC_026 rise to High priority.
- [ ] **A6** — Confirm with the product owner that unbranded-but-working beats branded-but-broken.

**Scenarios not yet covered** *(deliberate gaps, flagged for a decision)*
- [ ] **Flash of unstyled brand.** Colours apply after `branding.json` resolves, so a slow network may briefly show fallback colours. Not tested — needs a product call on whether it matters.
- [ ] **Very long organisation names.** CSS truncates with ellipsis; no test asserts the truncation boundary.
- [ ] **Offline / cached behaviour.** No service worker exists, so a repeat visit offline shows fallback branding. Out of scope for this issue.
- [ ] **Cross-browser rendering.** Vitest runs in jsdom only. No Safari or Firefox verification.
- [ ] **Visual regression.** No screenshot baseline; a CSS change could silently alter layout.

**Needs clarification from product/engineering**
- [ ] Should a branding load failure be reported anywhere (console, telemetry), or fail completely silently?
- [ ] Is the branded empty state (Caramel's face + slogan) in scope for this issue, or a separate ticket?
- [ ] Should `mobile` from `branding.json` be displayed? It is present in the data but unused in the current design.

---

## 6. Execution Record

| Field | Value |
| --- | --- |
| Automated by | `src/lib/branding.test.js`, `src/lib/gemini.test.js`, `src/components/Header.test.jsx`, `src/components/Composer.test.jsx` |
| Manual/build-level | TC_027, TC_028, TC_029 |
| Last run | _pending_ |
| Result | _pending_ |
