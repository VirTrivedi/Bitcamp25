from flask import Flask, request
from flask_cors import CORS  # Import CORS
import http.client
import urllib.parse  # Import for URL encoding
import json  # Import for JSON parsing

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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
        'x-rapidapi-key': "a0244a2f8bmshc3d892fbb75cd60p1243f0jsn5542a55d2e95",
        'x-rapidapi-host': "jsearch.p.rapidapi.com"
    }

    endpoint = f"/estimated-salary?{encoded_params}"
    conn.request("GET", endpoint, headers=headers)

    res = conn.getresponse()
    data = res.read()

    # Parse the JSON response
    try:
        parsed_data = json.loads(data.decode("utf-8"))
        if parsed_data.get("status") == "OK" and "data" in parsed_data:
            salary_data = parsed_data["data"][0]  # Extract the first result
            median_salary = salary_data.get("median_salary", "N/A")  # Get the median salary
            return str(median_salary)  # Return the median salary as a plain string
        else:
            return "Error: Failed to retrieve salary data"
    except json.JSONDecodeError:
        return "Error: Invalid JSON response from API"

if __name__ == '__main__':
    app.run(debug=True)