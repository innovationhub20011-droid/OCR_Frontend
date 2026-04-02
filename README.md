# SBI OCR Frontend

React + TypeScript frontend for an SBI-style OCR and document verification workflow. The application lets a user sign in, choose a document type, upload a file, preview the extracted output, edit extracted fields, save a draft, and submit the item into a verification queue.

## Overview

This project is a Vite-based single-page application built with React 18, TypeScript, and React Router.

The UI models a document-processing flow for:

- OVD documents such as PAN and Aadhaar
- Text extraction flows such as handwritten and digital text
- Bank forms such as account opening and loan forms
- Miscellaneous uploaded documents

The app combines two kinds of behavior:

- Real backend calls for supported extraction endpoints
- Local in-browser workflow state for session handling, review state, and verification queue simulation

## Core User Flow

1. Sign in with the demo account.
2. Land on the dashboard.
3. Choose to upload a supported document.
4. Select a document category and document type.
5. Upload an image or PDF and preview it locally.
6. Start extraction and move to the review screen.
7. Review extracted content depending on scenario type:
	 - OVD field review
	 - Text block review
	 - Form field review
	 - Miscellaneous placeholder summary
8. Save draft edits.
9. Submit the document for verification.
10. View submitted items in the verification queue.

## Features

### Authentication

- Demo login screen with hardcoded credentials
- Session persisted in `localStorage`
- Protected routes for authenticated pages

### Dashboard

- Document category overview
- Supported document type cards
- Navigation to upload and verification flows
- Activity and summary widgets

### Document Selection

- Categorized document chooser
- Visual icons per supported document type
- Single-click navigation into the upload flow

### Upload and Preview

- File upload for images and PDFs
- Local preview using object URLs
- Simulated progress before starting review

### Review Flow

- Scenario-aware review container
- Editable review for:
	- OVD fields
	- Text blocks
	- Form sections and pages
- Draft save support
- Submission to verification queue

### Verification Queue

- Displays submitted items waiting for verification
- Uses locally simulated verification records

### Backend Integration

The UI calls backend extraction endpoints for supported flows when available:

- PAN extraction
- Aadhaar extraction
- Handwritten text extraction
- Account opening form page 1 extraction

## Supported Document Types

### OVD Documents

- PAN Card
- Aadhaar Card
- Voter Card
- Passport
- Driving Licence

### Text Documents

- Handwritten Text
- Digital Text
- Miscellaneous Text Documents

### Bank Forms

- Account Opening Form
- Housing Loan Form
- Personal Loan Form

### Miscellaneous Documents

- Cheque
- Application
- Supporting Document

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Demo sign-in page |
| `/dashboard` | Main dashboard |
| `/dashboard/upload-documents` | Document type selection |
| `/dashboard/upload-documents/process` | Upload and local preview |
| `/dashboard/review` | Review extracted content |
| `/dashboard/verification-queue` | Submitted item queue |
| `/dashboard/settings` | Settings placeholder page |

## Tech Stack

- React 18
- TypeScript
- Vite 5
- React Router DOM 6

## Project Structure

```text
src/
	components/        Shared UI wrappers and route protection
	config/            UI and shell configuration
	constants/         App routes, API endpoints, document metadata
	hooks/             Shared hooks such as current-user state
	pages/             Route-level screens and page-specific components
	services/          Auth, backend API integration, workflow orchestration
	styles/            Global and page-level stylesheets
	types/             Shared TypeScript types
```

## Important Runtime Behavior

### Session Storage

- Authenticated user state is stored in `localStorage`
- The active extraction session is stored in `sessionStorage`

### Workflow State

The verification queue is simulated in memory through the workflow service. This means queue items are not backed by a permanent database and will reset when the app reloads unless additional persistence is added.

### Review Payloads

The review screen dynamically builds a payload based on the selected document scenario:

- `ovd`
- `text`
- `form`
- `misc`

## Installation

```bash
npm install
```

## Development

Start the local development server:

```bash
npm start
```

This runs Vite on the default development port.

## Build

Create a production build:

```bash
npm run build
```

The build first runs TypeScript checking through `tsc --noEmit` and then builds the Vite app.

## Preview Production Build

```bash
npm run preview
```

## Available Scripts

| Script | Description |
| --- | --- |
| `npm start` | Start Vite dev server |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and create production build |
| `npm run preview` | Preview production build locally |

## Demo Credentials

Use the built-in demo account:

- Email: `user.sbi@bank.com`
- Password: `User@123`

## Environment and Backend Configuration

The app supports an optional environment variable:

- `VITE_API_BASE_URL`

When provided, the frontend prefixes extraction requests with that base URL.

If `VITE_API_BASE_URL` is not set, the app still works in development through the configured Vite proxy for `/extract`.

## Development Proxy

During development, Vite proxies `/extract` requests to:

- `http://localhost:8000`

Configured in `vite.config.ts`.

## Backend Endpoints Expected by the Frontend

The frontend expects these extraction endpoints:

- `POST /extract/pan`
- `POST /extract/aadhaar`
- `POST /extract/text/handwritten_text`
- `POST /extract/account-opening/page1`

Each request sends multipart form data with a single file field named `file`.

## Current Limitations

- Verification queue data is simulated in the browser and is not permanently persisted.
- The settings page is currently a placeholder.
- Miscellaneous document review uses a placeholder renderer.
- Some document scenarios rely on template payloads when backend extraction is unavailable.
- There is currently no automated test suite configured in `package.json`.

## Recommended Next Improvements

- Persist verification records to a real backend or local indexed storage
- Add automated tests for services and route flows
- Expand settings into a real configuration page
- Add richer error handling and retry logic for extraction failures
- Add support for more backend extraction endpoints and normalized response adapters
