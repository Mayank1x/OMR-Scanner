# OMR Checker Project

AI-assisted OMR (Optical Mark Recognition) grading system with a FastAPI backend and a React dashboard frontend. The app can grade multiple student sheets in one run using a Hugging Face vision-language model, then show analytics and export results.

## Overview

This project is built for fast batch grading workflows:

- Define answer keys from CSV or with a visual key editor.
- Upload multiple OMR sheet images in one request.
- Grade sheets through an AI model hosted on Hugging Face.
- Review per-student details and class-level analytics.
- Export grading results as CSV or JSON.

## Main Features

- Bulk OMR grading endpoint for many images at once.
- Two answer-key input modes:
	- CSV upload
	- Visual key editor (A/B/C/D per question)
- Per-question details for each student:
	- selected option
	- expected option
	- correct or incorrect status
	- multiple-mark detection
- Analytics view with average, highest, lowest, and score distribution.
- Downloadable result files for reporting.

## Tech Stack

- Backend: Python, FastAPI, Uvicorn, OpenCV, NumPy, huggingface_hub
- Frontend: React, Vite, Tailwind CSS, lucide-react
- AI Model: Qwen/Qwen2.5-VL-7B-Instruct (via Hugging Face Inference API)

## Project Structure

- backend/: FastAPI API and grading logic
- frontend/: React dashboard
- tests/: mock data generator and sample CSV

## How It Works

1. The backend receives images and an answer key.
2. Each image is resized/compressed to reduce payload size.
3. The image is sent to Hugging Face inference with an OMR extraction prompt.
4. The returned answer map is parsed and matched against the answer key.
5. Scores and per-question details are returned to the frontend.
6. Frontend presents grading table, analytics, and export options.

## Prerequisites

- Python 3.10+ (recommended)
- Node.js 18+ and npm
- A Hugging Face API token with inference access

## Setup and Run

### 1) Start Backend

From the project root:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create backend/.env with your token:

```env
HF_API_KEY=hf_your_token_here
```

Run API server:

```bash
uvicorn main:app --reload
```

Backend will run on:

- http://127.0.0.1:8000

### 2) Start Frontend

Open another terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on:

- http://localhost:5173

## Usage Guide

### Option A: Grade with CSV Answer Key

1. Open the Grading tab.
2. Keep Use Visual Key toggle OFF.
3. Upload a CSV answer key.
4. Upload one or more OMR sheet images.
5. Click Start Grading.

### Option B: Grade with Visual Answer Key

1. Go to Answer Keys tab.
2. Set question count and select A/B/C/D per question.
3. Return to Grading tab.
4. Turn ON Use Visual Key.
5. Upload student sheet images and start grading.

### Analyze and Export

- Analytics tab: class-level performance summary.
- Settings tab: choose export format (CSV or JSON).
- Download button exports current batch results.

## Answer Key Format

### CSV Format

Supported formats per row:

- 1,B
- 2,C
- 3,A

Rules:

- First column: question number (1-based)
- Second column: A/B/C/D (or numeric index 0/1/2/3)
- Invalid rows are skipped

### Visual Key Format (internal)

When using visual key, frontend sends JSON like:

```json
{
	"0": 1,
	"1": 2,
	"2": 0
}
```

Where:

- key = 0-based question index
- value = option index (A=0, B=1, C=2, D=3)

## API Reference

### POST /grade-omr-bulk/

Request (multipart/form-data):

- images: one or more image files (required)
- answer_key_csv: CSV file (optional if answer_key_json is provided)
- answer_key_json: JSON string (optional if answer_key_csv is provided)

Response:

- batch_results: array with per-file result objects

Successful file result includes:

- filename
- success: true
- data.score
- data.max_score
- data.results[] per question

Failed file result includes:

- filename
- success: false
- error

## Testing with Mock Data

You can generate test OMR sheets and call the API using:

```bash
python tests/generate_mock_omr.py
```

This script:

- creates mock OMR images
- writes a sample CSV answer key
- calls the local API endpoint
- prints the response

Important: Run backend server first before executing this test script.

## Troubleshooting

- 401 or authentication errors from Hugging Face:
	- verify backend/.env exists
	- verify HF_API_KEY value is valid
	- restart backend after updating environment variables
- Failed to parse answer key:
	- verify CSV has valid two-column rows
	- verify JSON string is valid and maps question indexes to option indexes
- Frontend cannot reach backend:
	- confirm backend is running on port 8000
	- verify frontend uses http://localhost:8000/grade-omr-bulk/
- Incorrect grading for noisy scans:
	- use clearer scans/images
	- ensure bubbles are visible and not blurred
	- avoid extreme perspective distortion

## Security Notes

- Do not commit backend/.env or API keys.
- Rotate Hugging Face token if accidentally exposed.
- Restrict CORS origins in production (backend currently allows all origins).

## Future Improvements

- Add authentication and role-based access.
- Add persistent grading history database.
- Add retry and fallback model strategy.
- Add confidence scoring and low-confidence review queue.

