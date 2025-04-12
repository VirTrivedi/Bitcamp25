from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from collections import deque

app = Flask(__name__)
CORS(app)

cluster = MongoClient("mongodb+srv://sidk4156:wd8lTyefzJgty3Nb@cluster0.ol8pdzi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = cluster["jobs"]
collection = db["username"]

class User:
    def __init__(self, id: int, username: str, password: str):
        self.id = id
        self.username = username
        self.password = password
        self.recentSearchList = deque(maxlen=5)

class RecentSearch:
    def __init__(self, jobTitle: str, location: str, med_salary: str, url: str = None):
        self.jobTitle = jobTitle
        self.location = location
        self.med_salary = med_salary
        self.url = url

def add_to_recent_search(user_id: int, RS: RecentSearch):
    user = collection.find_one({"_id": user_id})
    if not user:
        return {"error": "User not found"}, 404

    searches = []
    for i in range(1, 6):
        rs = user.get(f"rs{i}")
        if rs:
            searches.append(rs)

    searches.insert(0, RS.__dict__)
    searches = searches[:5]  # keep at most 5

    update = {f"rs{i+1}": searches[i] if i < len(searches) else None for i in range(5)}
    collection.update_one({"_id": user_id}, {"$set": update})

    return {"message": "Recent search added", "recent_searches": searches}

def convert_user(user):
    user["id"] = user.pop("_id")
    return user

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "MongoDB Flask backend is working!"})

@app.route("/users/<int:user_id>/username", methods=["GET"])
def get_username(user_id):
    user = collection.find_one({"_id": user_id})
    if user:
        return user["username"]
    return jsonify({"error": "User not found"}), 404

@app.route("/users/<int:user_id>/password", methods=["GET"])
def get_password(user_id):
    user = collection.find_one({"_id": user_id})
    if user:
        return user["password"]
    return jsonify({"error": "User not found"}), 404
    
@app.route("/users/", methods=["POST"])
def create_user():
    data = request.json
    if collection.find_one({"_id": data["id"]}):
        return jsonify({"error": "User already exists"}), 400

    collection.insert_one({
        "_id": data["id"],
        "username": data["username"],
        "password": data["password"],
        "rs1": None, "rs2": None, "rs3": None, "rs4": None, "rs5": None
    })

    return jsonify({"message": "User created", "user": data})

@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = collection.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(convert_user(user))

@app.route("/users/", methods=["GET"])
def get_all_users():
    users = []
    for user in collection.find({}):
        users.append(convert_user(user))
    return jsonify(users)

@app.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json()
    result = collection.update_one({"_id": user_id}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"message": "User updated"})

@app.route("/users/<int:user_id>/recent", methods=["POST"])
def add_recent_search(user_id):
    data = request.json
    try:
        rs = RecentSearch(
            jobTitle=data["jobTitle"],
            location=data["location"],
            med_salary=data["med_salary"]
        )
        return jsonify(add_to_recent_search(user_id, rs))
    except KeyError:
        return jsonify({"error": "Missing jobTitle/location/med_salary"}), 400
    
@app.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    result = collection.delete_one({"_id": user_id})
    if result.deleted_count == 0:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"message": "User deleted"})

@app.route("/users/delete_all", methods=["DELETE"])
def delete_all_users():
    result = collection.delete_many({})
    return jsonify({"message": "All users deleted"})

@app.route("/users/<int:user_id>/recent", methods=["GET"])
def get_recent_searches(user_id):
    user = collection.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404

    recent_searches = []
    for i in range(1, 6):
        rs = user.get(f"rs{i}")
        if rs:
            recent_searches.append(rs)

    return jsonify(recent_searches)

@app.route("/users/<int:user_id>/recent/med_salary", methods=["PUT"])
def update_recent_search_med_salary(user_id):
    data = request.json
    if "med_salary" not in data:
        return jsonify({"error": "Missing med_salary"}), 400

    user = collection.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Update the med_salary of the most recent search (rs1)
    if user.get("rs1"):
        user["rs1"]["med_salary"] = data["med_salary"]
        collection.update_one({"_id": user_id}, {"$set": {"rs1": user["rs1"]}})
        return jsonify({"message": "Recent search med_salary updated", "recent_search": user["rs1"]})

    return jsonify({"error": "No recent searches found"}), 404

@app.route("/users/<int:user_id>/recent/url", methods=["PUT"])
def update_recent_search_url(user_id):
    data = request.json
    if "url" not in data:
        return jsonify({"error": "Missing url"}), 400

    user = collection.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Update the url of the most recent search (rs1)
    if user.get("rs1"):
        user["rs1"]["url"] = data["url"]
        collection.update_one({"_id": user_id}, {"$set": {"rs1": user["rs1"]}})
        return jsonify({"message": "Recent search url updated", "recent_search": user["rs1"]})

    return jsonify({"error": "No recent searches found"}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5003)