from flask import Flask, jsonify
from routes.metrics import metrics_blueprint
from routes.assessments import assessments_blueprint

app = Flask(__name__)
app.register_blueprint(metrics_blueprint)
app.register_blueprint(assessments_blueprint)

@app.route("/")
def health_check():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)