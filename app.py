
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import mysql.connector
import os

load_dotenv()
app = Flask(__name__)


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT", "3306")),
        ssl_ca=os.getenv("DB_SSL_CA", "ca.pem"),
        ssl_verify_cert=True,
        ssl_verify_identity=True
    )


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/db-test")
def db_test():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM tasks")
        count = cursor.fetchone()[0]
        cursor.close()
        connection.close()
        return f"Database connected successfully! Tasks: {count}"
    except mysql.connector.Error as error:
        app.logger.error("Database error: %s", error)
        return "Database connection failed. Check terminal.", 500


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, title, description, priority,
                   DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
                   status
            FROM tasks
            ORDER BY id DESC
        """)
        return jsonify(cursor.fetchall())
    finally:
        cursor.close()
        connection.close()


@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON data"}), 400

    title = data.get("title", "")

    if not isinstance(title, str) or not title.strip():
        return jsonify({"error": "Title is required"}), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            INSERT INTO tasks (title, description, priority, due_date)
            VALUES (%s, %s, %s, %s)
        """, (
            title.strip(),
            data.get("description", ""),
            data.get("priority", "Medium"),
            data.get("due_date") or None
        ))

        connection.commit()

        return jsonify({
            "message": "Task saved successfully",
            "id": cursor.lastrowid
        }), 201
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    app.run(debug=True)
