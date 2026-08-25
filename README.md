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

## 🔒 Security

The API key ships in the browser bundle, so **anyone who opens a deployed site
can read it**. That is acceptable for a local prototype and unacceptable for
anything public. For production, move the `streamChat` call behind a small
server that holds the key.

`.env` is gitignored. Never commit it.

## 📄 License

[MIT](LICENSE) © HERE AND NOW AI

---

<div align="center">

**[HERE AND NOW AI](https://hereandnowai.com)** — _AI is Good_

</div>
