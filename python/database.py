from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

cluster = MongoClient("mongodb+srv://sidk4156:wd8lTyefzJgty3Nb@cluster0.ol8pdzi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = cluster["jobs"]
collection = db["username"]

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
    data = request.get_json()
    user_id = data.get("id")
    if collection.find_one({"_id": user_id}):
        return jsonify({"error": "User with this ID already exists."}), 400
    collection.insert_one({
        "_id": user_id,
        "username": data["username"],
        "password": data["password"]
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

if __name__ == "__main__":
    app.run(debug=True, port=5003)