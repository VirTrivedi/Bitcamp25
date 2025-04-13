from flask import Flask, request
from flask_cors import CORS  # Import CORS
import http.client
import urllib.parse  # Import for URL encoding
import json  # Import for JSON parsing
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

@app.route('/get-estimated-salary', methods=['GET'])
def get_estimated_salary():
    job_title = request.args.get('job_title', 'nodejs developer')
    location = request.args.get('location', 'new york')
    location_type = request.args.get('location_type', 'ANY')
    years_of_experience = request.args.get('years_of_experience', 'ALL')

    # Map user-friendly input to API-expected values
    experience_mapping = {
        'ALL': 'ALL',
        'LESS_THAN_ONE': 'LESS_THAN_ONE',
        'ONE_TO_THREE': 'ONE_TO_THREE',
        'FOUR_TO_SIX': 'FOUR_TO_SIX',
        'SEVEN_TO_NINE': 'SEVEN_TO_NINE',
        'TEN_TO_FOURTEEN': 'TEN_TO_FOURTEEN',
        'ABOVE_FIFTEEN': 'ABOVE_FIFTEEN'
    }

    # Validate and map years_of_experience
    years_of_experience = experience_mapping.get(years_of_experience.upper(), 'ALL')

    # Encode query parameters to handle spaces and special characters
    query_params = {
        "job_title": job_title,
        "location": location,
        "location_type": location_type,
        "years_of_experience": years_of_experience
    }
    encoded_params = urllib.parse.urlencode(query_params)

    conn = http.client.HTTPSConnection("jsearch.p.rapidapi.com")

    headers = {
        'x-rapidapi-key': "7aa0141247msh249b26dba048d27p1acdeajsnfffe5b497bc4",
        'x-rapidapi-host': "jsearch.p.rapidapi.com"
    }

    endpoint = f"/estimated-salary?{encoded_params}"
    conn.request("GET", endpoint, headers=headers)

    res = conn.getresponse()
    if res.status != 200:  # Check for non-200 status codes
        return f"Error: API request failed with status {res.status} - {res.reason}"

    data = res.read()

    # Parse the JSON response
    try:
        parsed_data = json.loads(data.decode("utf-8"))
        if parsed_data.get("status") == "OK" and "data" in parsed_data:
            salary_data = parsed_data["data"][0]  # Extract the first result
            median_salary = salary_data.get("median_salary", "N/A")  # Get the median salary
            min_salary = salary_data.get("min_salary", "N/A")  # Get the minimum salary
            max_salary = salary_data.get("max_salary", "N/A")  # Get the maximum salary
            salary_currency = salary_data.get("salary_currency", "N/A")  # Get the salary currency
            return json.dumps({
                "median_salary": median_salary,
                "min_salary": min_salary,
                "max_salary": max_salary,
                "salary_currency": salary_currency
            })  # Return all salary data as JSON
        else:
            return "Error: Failed to retrieve salary data"
    except json.JSONDecodeError:
        return "Error: Invalid JSON response from API"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)  # Bind to all IPs and use port 5000