# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import firebase_admin
# from firebase_admin import credentials, firestore

# app = Flask(__name__)
# CORS(app)

# cred = credentials.Certificate("serviceAccountKey.json")
# firebase_admin.initialize_app(cred)
# db = firestore.client()

# @app.route('/students', methods=['GET'])
# def get_students():
#     docs = db.collection('students').stream()
#     data = [doc.to_dict() for doc in docs]
#     return jsonify(data), 200

# @app.route('/students', methods=['POST'])
# def add_student():
#     student = request.get_json()
#     db.collection('students').add(student)
#     return jsonify({"message": "Student added successfully"}), 201

# if __name__ == '__main__':
#     app.run(debug=True)


from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/roadmap', methods=['POST'])
def generate_roadmap():
    data = request.get_json()
    name = data.get("name")
    goal = data.get("goal")
    skills = data.get("skills")
    time = data.get("time")
    duration = data.get("duration")
    # Demo roadmap response
    roadmap = {
        "message": f"Hello {name}, here is your {duration}-month roadmap for your goal: {goal} (skills: {skills}, time per day: {time} hour(s))."
    }
    return jsonify(roadmap)

if __name__ == '__main__':
    app.run(debug=True)
