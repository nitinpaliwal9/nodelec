# Nodelec AI

> An agentic procurement and BOM (Bill of Materials) parsing pipeline designed to automate incoming WhatsApp and Email RFQs from intake to professional quotation in 60 seconds.

## Overview
**Nodelec AI** is an intelligent B2B distribution and procurement automation platform. It bridges unstructured customer queries (via WhatsApp, email, or documents) with backend ERP systems, replacing hours of manual data entry, error correction, and pricing checks with autonomous agent workflows.

## Tech Stack
* **Frontend / UI:** Next.js, React, Tailwind CSS
* **Backend & API:** Python, FastAPI, asynchronous event processing
* **Agentic / AI Layer:** LLM tool calling, custom prompt pipelines, and vector/semantic search for document parsing
* **Database & Integrations:** PostgreSQL, REST APIs for ERP connectors (Tally, SAP, Oracle, NetSuite, Odoo)

## Core Architecture & Features
* **Multi-Channel Intake:** Listens to and parses incoming customer RFQs directly where they happen (WhatsApp and Email channels).
* **Automated BOM Parsing:** Extracts component data from complex, unstructured files (PDFs/spreadsheets) with high accuracy.
* **The 15-Day Guardrail (HITL Mode):** Features a structured human-in-the-loop transition phase where AI drafts quotes and requires team sign-off before unlocking full-auto mode based on rolling accuracy tracking.
* **Dynamic Pricing & ERP Sync:** Real-time synchronization with inventory systems combined with smart pricing analytics to optimize quote margins.

## Project Structure
```text
nodelec/
├── backend/                  # Python FastAPI services & agentic parsing logic
├── frontend/                 # Next.js client interface & dashboard
├── integrations/             # ERP connectors & multi-channel webhooks (WhatsApp/Email)
└── supabase/                 # Database schemas and security rules
