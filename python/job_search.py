from flask import Flask, request, jsonify
from flask_cors import CORS
import http.client

app = Flask(__name__)
CORS(app)

@app.route('/jobs', methods=['GET'])
def get_jobs():
    query = request.args.get('query', default='developer jobs', type=str)
    
    conn = http.client.HTTPSConnection("jsearch.p.rapidapi.com")
    headers = {
        'x-rapidapi-key': "f57d15d611msh794a720ffa9343cp1aa093jsn1e7ef38d2c9a",
        'x-rapidapi-host': "jsearch.p.rapidapi.com"
    }
    
    endpoint = f"/search?query={query.replace(' ', '%20')}&page=1&num_pages=1&country=us&date_posted=all"
    conn.request("GET", endpoint, headers=headers)
    
    res = conn.getresponse()
    data = res.read()
    
    return jsonify({"jobs": data.decode("utf-8")})

if __name__ == '__main__':
    app.run(debug=True, port=5002)
