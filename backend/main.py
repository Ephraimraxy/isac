"""
FastAPI Backend for Assessment Question Generation and Scoring
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import PyPDF2
import io
from transformers import pipeline
import json
from google.cloud import firestore
import os

app = FastAPI(title="Assessment Generator API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firestore
db = firestore.Client()

# Initialize question generation pipeline
# Using a lightweight model for question generation
try:
    question_generator = pipeline(
        "text2text-generation",
        model="iarfmoose/t5-base-question-generator",
        device=-1  # Use CPU
    )
except Exception as e:
    print(f"Warning: Could not load question generator model: {e}")
    question_generator = None


class GenerateQuestionsRequest(BaseModel):
    moduleId: str
    pdfUrl: str


class QuestionOption(BaseModel):
    question: str
    options: List[str]
    correctAnswer: str


class GenerateQuestionsResponse(BaseModel):
    questions: List[QuestionOption]


class AnswerRequest(BaseModel):
    questionId: str
    answer: str


class ScoreAssessmentRequest(BaseModel):
    moduleId: str
    assessmentId: str
    traineeId: str
    answers: List[AnswerRequest]


class ScoreAssessmentResponse(BaseModel):
    score: int
    total: int
    percentage: float


def extract_text_from_pdf(pdf_url: str) -> str:
    """Download PDF from URL and extract text"""
    try:
        response = requests.get(pdf_url, timeout=30)
        response.raise_for_status()
        
        pdf_file = io.BytesIO(response.content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")


def generate_questions_from_text(text: str, num_questions: int = 10) -> List[dict]:
    """Generate multiple choice questions from text using AI model"""
    if not question_generator:
        # Fallback: Generate simple questions if model not available
        return generate_fallback_questions(text, num_questions)
    
    try:
        # Split text into chunks (each chunk will generate 1-2 questions)
        chunk_size = 500  # characters per chunk
        chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
        questions = []
        for chunk in chunks[:num_questions]:
            if len(chunk.strip()) < 50:  # Skip very short chunks
                continue
            
            # Generate question using the model
            prompt = f"Generate a multiple choice question with 4 options from this text. Format: Question: [question] Options: A) [option1] B) [option2] C) [option3] D) [option4] Correct Answer: [letter]\n\nText: {chunk[:400]}"
            
            try:
                result = question_generator(prompt, max_length=200, num_return_sequences=1)
                generated_text = result[0]['generated_text']
                
                # Parse the generated question
                question_data = parse_generated_question(generated_text, chunk)
                if question_data:
                    questions.append(question_data)
            except Exception as e:
                print(f"Error generating question: {e}")
                # Fallback to simple question
                question_data = generate_simple_question(chunk)
                if question_data:
                    questions.append(question_data)
        
        # Ensure we have at least some questions
        while len(questions) < num_questions and len(questions) < 10:
            # Generate additional simple questions
            question_data = generate_simple_question(text)
            if question_data and question_data not in questions:
                questions.append(question_data)
        
        return questions[:num_questions]
    except Exception as e:
        print(f"Error in question generation: {e}")
        return generate_fallback_questions(text, num_questions)


def parse_generated_question(generated_text: str, source_text: str) -> Optional[dict]:
    """Parse generated question text into structured format"""
    try:
        # Simple parsing logic - can be improved
        lines = generated_text.split('\n')
        question = ""
        options = []
        correct_answer = ""
        
        for line in lines:
            if 'Question:' in line or 'question:' in line.lower():
                question = line.split(':', 1)[1].strip()
            elif any(opt in line for opt in ['A)', 'B)', 'C)', 'D)']):
                options.append(line.strip())
            elif 'Correct' in line or 'Answer:' in line:
                correct_answer = line.split(':')[-1].strip()
        
        if not question:
            return None
        
        # If parsing failed, generate simple question
        if not options or len(options) < 4:
            return generate_simple_question(source_text)
        
        return {
            "question": question,
            "options": options[:4],
            "correctAnswer": correct_answer if correct_answer else options[0]
        }
    except Exception as e:
        print(f"Error parsing question: {e}")
        return None


def generate_simple_question(text: str) -> dict:
    """Generate a simple question from text as fallback"""
    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 20]
    if not sentences:
        return None
    
    # Use first meaningful sentence as basis
    base_sentence = sentences[0][:100]
    
    # Create a simple question
    question = f"What is mentioned about: {base_sentence[:50]}?"
    
    # Generate options
    options = [
        base_sentence[:50] + "...",
        "It is not mentioned.",
        "The text does not specify.",
        "None of the above."
    ]
    
    return {
        "question": question,
        "options": options,
        "correctAnswer": options[0]
    }


def generate_fallback_questions(text: str, num_questions: int) -> List[dict]:
    """Generate fallback questions when AI model is unavailable"""
    questions = []
    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 30]
    
    for i, sentence in enumerate(sentences[:num_questions]):
        if len(sentence) < 30:
            continue
        
        question = f"According to the material, what is true about: {sentence[:60]}?"
        options = [
            sentence[:60] + "...",
            "This information is not provided.",
            "The material does not specify this.",
            "None of the above."
        ]
        
        questions.append({
            "question": question,
            "options": options,
            "correctAnswer": options[0]
        })
    
    return questions


@app.post("/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(request: GenerateQuestionsRequest):
    """
    Generate questions from PDF
    1. Download PDF from Firebase Storage URL
    2. Extract text from PDF
    3. Generate questions using AI model
    4. Return structured questions
    """
    try:
        # Extract text from PDF
        print(f"Extracting text from PDF: {request.pdfUrl}")
        text = extract_text_from_pdf(request.pdfUrl)
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="PDF text extraction failed or PDF is empty"
            )
        
        # Generate questions
        print("Generating questions from text...")
        questions = generate_questions_from_text(text, num_questions=10)
        
        if not questions or len(questions) == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate questions from PDF"
            )
        
        return GenerateQuestionsResponse(questions=questions)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_questions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/score-assessment", response_model=ScoreAssessmentResponse)
async def score_assessment(request: ScoreAssessmentRequest):
    """
    Score assessment by comparing trainee answers with correct answers
    1. Fetch correct answers from Firestore
    2. Compare with trainee answers
    3. Calculate score
    4. Return score
    """
    try:
        # Fetch questions from Firestore
        questions_ref = db.collection('modules').document(request.moduleId).collection('questions')
        questions_docs = questions_ref.stream()
        
        # Create a map of questionId -> correct answer
        correct_answers = {}
        for doc in questions_docs:
            data = doc.to_dict()
            correct_answers[doc.id] = data.get('correctAnswer', '')
        
        # Score the assessment
        score = 0
        total = len(correct_answers)
        
        for answer_req in request.answers:
            question_id = answer_req.questionId
            trainee_answer = answer_req.answer
            
            if question_id in correct_answers:
                correct_answer = correct_answers[question_id]
                # Compare answers (case-insensitive, trimmed)
                if trainee_answer.strip().lower() == correct_answer.strip().lower():
                    score += 1
        
        percentage = (score / total * 100) if total > 0 else 0
        
        return ScoreAssessmentResponse(
            score=score,
            total=total,
            percentage=round(percentage, 2)
        )
    
    except Exception as e:
        print(f"Error in score_assessment: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": question_generator is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

