# Assessment Generator Backend

Python FastAPI backend for generating questions from PDFs and scoring assessments.

## Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up Firebase credentials:**
   - Download your Firebase service account key from Firebase Console
   - Set environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
   ```

3. **Run the server:**
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### POST /generate-questions
Generate multiple choice questions from a PDF.

**Request:**
```json
{
  "moduleId": "module123",
  "pdfUrl": "https://firebasestorage.googleapis.com/..."
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}
```

### POST /score-assessment
Score a trainee's assessment.

**Request:**
```json
{
  "moduleId": "module123",
  "assessmentId": "assessment123",
  "traineeId": "user123",
  "answers": [
    {
      "questionId": "q1",
      "answer": "Option A"
    }
  ]
}
```

**Response:**
```json
{
  "score": 8,
  "total": 10,
  "percentage": 80.0
}
```

### GET /health
Health check endpoint.

## Environment Variables

- `GOOGLE_APPLICATION_CREDENTIALS`: Path to Firebase service account key JSON file
- `VITE_BACKEND_URL`: Backend URL (set in frontend .env file)

## Notes

- The question generator uses HuggingFace's T5 model for question generation
- First run will download the model (~500MB)
- For production, consider using a GPU for faster question generation
- PDF text extraction supports standard PDFs (not scanned images)

