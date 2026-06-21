# 06 — AI Assistant (later)

> Deferred until after the priority milestone (P9) and the core ERP/portal services. Sketched now so the platform leaves room for it. Provider defaulted to **Claude / Anthropic** (changeable).

## Goal
An AI assistant embedded in the **staff portal** and the **client portal** that helps users get things done in natural language (Arabic + English): answer "what's the status of my project / phase?", draft content, summarize threads, surface tasks, etc. — scoped to the caller's permissions.

## Provider
- **Claude (Anthropic)** via the official SDK. Use the latest capable model. (Smart-restaurant used Gemini; for Sanad default to Claude — revisit if cost/latency dictates.)
- Model id + keys via env + the typed accessor (U19); never hardcoded (U14).

## Architecture (fits the microservices boundary)
- A dedicated **`ai-assistant-service`** (own DB for conversations/messages/tool-invocations), created by promoting a stable lib (MS9).
- **Tools = RMQ request/reply** into the owning services (MS2) — the assistant reads through services' query patterns into base repos, so hidden-field stripping (N2), soft-delete scoping, RBAC and tenant/ownership scoping apply for free. **NEVER** raw DB access from the assistant.
- **Read-only first.** Any write tool goes through the normal service command + validation + RBAC, never a privileged bypass.
- Scope every tool call to the caller's identity/roles (forwarded by the gateway, MS4); a client can only reach their own data.
- Stream responses to the portal; persist conversation history; honor ar/en.

## Guardrails
- Permission-checked tools only; no tool may exceed the user's own access.
- Localized (Arabic-first) responses; respect settings/branding tone.
- Cost/rate controls; audit every tool invocation.

## Acceptance (when built)
A staff or client user can ask, in Arabic or English, a question answerable from data they're allowed to see, and the assistant answers using permission-scoped tools — with no path to data outside their access.
