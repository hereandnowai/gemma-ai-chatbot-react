<div align="center">

# 🤖 Gemma AI Chatbot — React

### **HERE AND NOW AI**
**_"AI is Good"_**

[![Website](https://img.shields.io/badge/Website-hereandnowai.com-0b57d0?style=flat-square)](https://hereandnowai.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)](https://vite.dev)

</div>

---

## 📖 Overview

A frontend-only AI chatbot prototype. React + Vite talks straight to the
**Google AI Studio** API and streams the reply token by token — no backend,
no database, no build step beyond Vite.

Default model: **`gemma-4-31b-it`**.

## ✨ Features

- **Token-by-token streaming** over Server-Sent Events
- **Reasoning-aware** — the model streams an internal scratchpad; the UI shows only the answer
- **Stop mid-reply** via `AbortController`
- **Full conversation history** sent on every turn
- **Auto-growing composer** — `Enter` sends, `Shift+Enter` adds a newline
- **Zero runtime dependencies** beyond React

## 🚀 Quick Start

```bash
git clone https://github.com/hereandnowai/gemma-ai-chatbot-react.git
cd gemma-ai-chatbot-react
npm install

cp .env.example .env      # add your key from https://aistudio.google.com/apikey
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

> Changing `.env` requires restarting the dev server.

## ⚙️ Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_GEMINI_API_KEY` | _(required)_ | Google AI Studio API key |
| `VITE_GEMINI_MODEL` | `gemma-4-31b-it` | Model to call |

List the models your key can reach:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$VITE_GEMINI_API_KEY" \
  | grep '"name"'
```

## 🗂️ Project Structure

| File | Role |
| --- | --- |
| `src/lib/gemini.js` | API call, SSE parsing, thought-part filtering |
| `src/App.jsx` | Chat state, history, abort, reset |
| `src/components/Message.jsx` | A single chat bubble |
| `src/components/Composer.jsx` | Auto-growing input |

## 🧠 Implementation Notes

**Gemma rejects `systemInstruction`.** The Gemini API accepts that field for
Gemini models but not for Gemma, so the persona is prepended to the first user
turn instead.

**The model thinks out loud.** `gemma-4-31b-it` streams reasoning as parts
flagged `"thought": true`. Those are filtered out — rendering them would dump
the entire scratchpad into the chat bubble.

**Reasoning consumes the token budget.** `maxOutputTokens` covers thinking
tokens too, so it's set to 4096; a smaller cap gets spent on thoughts and
truncates the answer.

## 🚀 Deployment

Pushes to `main` trigger [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

```
push/PR → ci (lint + build)
             └── main only → build-site (inject key, set base path) → deploy → Pages
```

Live at **https://hereandnowai.github.io/gemma-ai-chatbot-react/**

Pull requests run the `ci` job only — they lint and build, but never deploy and
never touch the key.

| GitHub setting | Name | Value |
| --- | --- | --- |
| Secret | `VITE_GEMINI_API_KEY` | your Google AI Studio key |
| Variable | `VITE_GEMINI_MODEL` | `gemma-4-31b-it` |

Set under **Settings → Secrets and variables → Actions**.

## 🔒 Security

> ### ⚠️ The deployed key is publicly readable
>
> Vite inlines `VITE_GEMINI_API_KEY` into the JavaScript bundle **at build
> time**. Storing it as a GitHub secret keeps it out of the repository and out
> of Actions logs — but not out of the shipped site. Any visitor can find it:
>
> ```
> DevTools → Sources → assets/index-*.js → search "AIza"
> ```
>
> **Therefore: use a dedicated, disposable key for this deployment.** Never the
> key you use locally or anywhere else. Rotate it if usage looks wrong, and
> watch quota at https://aistudio.google.com/apikey.
>
> **To remove this exposure entirely**, the `streamChat` call in
> `src/lib/gemini.js` has to move behind a server that holds the key — a
> Cloudflare Worker or a Vercel function is about 40 lines. The browser then
> calls your endpoint, and the key never leaves the server.

`.env` is gitignored and must never be committed.

## 📄 License

[MIT](LICENSE) © HERE AND NOW AI

---

<div align="center">

**[HERE AND NOW AI](https://hereandnowai.com)** — _AI is Good_

</div>
