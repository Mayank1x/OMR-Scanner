# OMR Scanner & Grader Dashboard

A professional, minimal, and AI-driven Optical Mark Recognition (OMR) grading system. The backend replaces traditional brittle OpenCV rules with the Hugging Face Free Inference API (powered by `Qwen2.5-VL-7B-Instruct`) for infinite template mapping precision.

## 🚀 Key Features

- **Visual Answer Key Editor:** Dynamically build your correct answer template inside the UI with an interactive grid, or upload a legacy CSV.
- **Bulk AI Processing:** Drop dozens of real-world OMR sheets and grade them instantly using a robust Vision-Language Model.
- **Class Analytics Dashboard:** Render custom CSS bar charts showing class averages, highest scores, lowest scores, and pass/fail distribution matrices. 
- **CSV Extract:** 1-click export of verified `.csv` grades for seamless database injection.
- **Clean Architecture:** Fully decoupled FastAPI Python backend communicating with a Vite-React Glassmorphism UI.

---

## 💻 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS (v3), Lucide Icons
- **Backend:** Python, FastAPI, Hugging Face Hub, OpenCV (Payload Downscaling)
- **AI Engine:** Hugging Face Inference API (`Qwen/Qwen2.5-VL-7B-Instruct`)

---

## 🛠 Setup Instructions

### 1. Configure the AI Backend
Navigate to the central backend.
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```
**API Keys:** Create a `.env` file inside the `backend/` directory and securely paste your Hugging Face Token:
`HF_API_KEY="hf_..."`

Run the server locally:
```bash
uvicorn main:app --reload
```

### 2. Launch the React Frontend
Open a new terminal and prepare the dashboard.
```bash
cd frontend
npm install
npm run dev
```

Navigate your browser to `http://localhost:5173`. Drop some sheets, construct a key, and start grading instantly!
