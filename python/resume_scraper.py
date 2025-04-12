from openai import OpenAI
from datetime import date
import PyPDF2
import re
from flask import Flask, request, jsonify
import os
import logging
from flask_cors import CORS
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

load_dotenv()

# Ensure the API key is set
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("The OPENAI_API_KEY environment variable is not set. Please set it before running the application.")

client = OpenAI(api_key=api_key)

def extract_text_from_pdf(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ''
            for page in reader.pages:
                text += page.extract_text()
        return text
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {e}")
        raise

def estimate_experience_years(resume_text, job_title):
    try:
        today = date.today()
        formatted_date = today.strftime("%B %d, %Y")
        prompt = f"""
        Today’s date is {formatted_date}.

        You are a helpful assistant that estimates professional experience. Only count internships, full-time jobs, or paid technical work. Do **not** count personal projects or coursework.

        If the experience doesn't specify an end date and says "present", assume it ends today ({formatted_date}).

        Sum the durations of all qualifying experiences **in months**, then convert to **years by dividing by 12** and rounding down to the nearest whole number.

        Return a single number only — no extra text.

        Here is the resume:
        \"\"\"
        {resume_text}
        \"\"\"

        How many **years** of professional experience does this person have relevant to the job title: "{job_title}"?
        """

        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        trimmedResponse = response.choices[0].message.content.strip()
        match = re.search(r'\d+', trimmedResponse)
        return int(match.group()) if match else 0
    except Exception as e:
        logging.error(f"Error estimating experience years: {e}")
        raise

def suggest_job_titles(resume_text):
    try:
        prompt = f"""
        Based on the following resume, suggest 5 job titles that best match the candidate's skills and experience. 
        Provide only the job titles as a comma-separated list.

        Resume:
        \"\"\"
        {resume_text}
        \"\"\"
        """

        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        suggested_titles = response.choices[0].message.content.strip()
        return [title.strip() for title in suggested_titles.split(',')]
    except Exception as e:
        logging.error(f"Error generating job title suggestions: {e}")
        raise

def get_reasons_for_job_titles(resume_text, job_titles):
    try:
        prompt = f"""
        Based on the following resume, provide a 1-2 sentence explanation for why the candidate should consider each of the following job titles. 
        Use bullet points and keep the explanations concise.

        Resume:
        \"\"\"
        {resume_text}
        \"\"\"

        Job Titles:
        {', '.join(job_titles)}
        """

        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        reasons = response.choices[0].message.content.strip()
        return reasons.split('\n')
    except Exception as e:
        logging.error(f"Error generating reasons for job titles: {e}")
        raise

def suggest_job_titles_with_reasons(resume_text):
    try:
        prompt = f"""
        Based on the following resume, suggest 5 job titles that best match the candidate's skills and experience. 
        For each job title, provide a 1-2 sentence explanation for why the candidate should consider it.
        Use the following format:
        - Job Title: Explanation

        Resume:
        \"\"\"
        {resume_text}
        \"\"\"
        """

        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        suggestions = response.choices[0].message.content.strip()
        return suggestions.split('\n')
    except Exception as e:
        logging.error(f"Error generating job titles with reasons: {e}")
        raise

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/estimate-experience', methods=['POST'])
def estimate_experience():
    if 'file' not in request.files or 'job_title' not in request.form:
        return jsonify({"error": "Missing file or job_title"}), 400

    file = request.files['file']
    job_title = request.form['job_title']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    temp_path = "temp_resume.pdf"
    file.save(temp_path)

    try:
        logging.info(f"Processing file: {file.filename} for job title: {job_title}")
        resume_text = extract_text_from_pdf(temp_path)
        years = estimate_experience_years(resume_text, job_title)
        return jsonify({"job_title": job_title, "estimated_years": years})
    except Exception as e:
        logging.error(f"Error in /estimate-experience: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/suggest-job-titles', methods=['POST'])
def suggest_job_titles_route():
    if 'file' not in request.files:
        return jsonify({"error": "Missing file"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    temp_path = "temp_resume.pdf"
    file.save(temp_path)

    try:
        logging.info(f"Processing file: {file.filename} for job title suggestions")
        resume_text = extract_text_from_pdf(temp_path)
        job_titles = suggest_job_titles(resume_text)
        return jsonify({"suggested_job_titles": job_titles})
    except Exception as e:
        logging.error(f"Error in /suggest-job-titles: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/reasons-for-job-titles', methods=['POST'])
def reasons_for_job_titles_route():
    if 'file' not in request.files or 'job_titles' not in request.form:
        return jsonify({"error": "Missing file or job_titles"}), 400

    file = request.files['file']
    job_titles = request.form['job_titles']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    temp_path = "temp_resume.pdf"
    file.save(temp_path)

    try:
        logging.info(f"Processing file: {file.filename} for reasons for job titles")
        resume_text = extract_text_from_pdf(temp_path)
        job_titles_list = [title.strip() for title in job_titles.split(',')]
        reasons = get_reasons_for_job_titles(resume_text, job_titles_list)
        return jsonify({"reasons": reasons})
    except Exception as e:
        logging.error(f"Error in /reasons-for-job-titles: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/suggest-job-titles-with-reasons', methods=['POST'])
def suggest_job_titles_with_reasons_route():
    if 'file' not in request.files:
        logging.error("Missing file in the request.")
        return jsonify({"error": "Missing file"}), 400

    file = request.files['file']

    if file.filename == '':
        logging.error("No file selected.")
        return jsonify({"error": "No file selected"}), 400

    logging.info(f"Processing file: {file.filename} for job titles with reasons")

    temp_path = "temp_resume.pdf"
    file.save(temp_path)

    try:
        resume_text = extract_text_from_pdf(temp_path)
        suggestions_with_reasons = suggest_job_titles_with_reasons(resume_text)
        return jsonify({"suggestions_with_reasons": suggestions_with_reasons})
    except Exception as e:
        logging.error(f"Error in /suggest-job-titles-with-reasons: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    app.run(debug=True, port=5001)