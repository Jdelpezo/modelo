from flask import Flask, render_template, send_from_directory, request, jsonify
from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

# Configura Gemini con tu API Key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Diccionario con categorías y sus videos locales
videos_data = {
    "abecedario": {
        "title": "Abecedario en Lenguaje de Señas",
        "video_file": "abecedario.mp4"
    },
    "colores": {
        "title": "Colores en Lenguaje de Señas",
        "video_file": "colores.mp4"
    },
    "dias_de_la_semana": {
        "title": "Días de la semana en Lenguaje de Señas",
        "video_file": "dias_de_la_semana.mp4"
    },
    "saludos": {
        "title": "Saludos en Lenguaje de Señas",
        "video_file": "saludos.mp4"
    },
    "meses_del_año": {
        "title": "Meses del año en Lenguaje de Señas",
        "video_file": "meses_del_año.mp4"
    },
    "datos_personales": {
        "title": "Datos Personales en Lenguaje de Señas",
        "video_file": "datos_personales.mp4"
    },
    "formas_de_cortesia": {
        "title": "Formas de Cortesía en Lenguaje de Señas",
        "video_file": "formas_de_cortesia.mp4"
    },
    "palabras_varias": {
        "title": "Palabras Variadas en Lenguaje de Señas",
        "video_file": "palabras_varias.mp4"
    },
    "preguntas": {
        "title": "Palabras Varias en Lenguaje de Señas",
        "video_file": "preguntas.mp4"
    }
}

# Preguntas del quiz
quiz_questions = [
    {
        "id": 1,
        "video_file": "a.mp4",
        "correct_answer": "A",
        "options": ["A", "B", "C", "D"]
    },
    {
        "id": 2,
        "video_file": "b.mp4",
        "correct_answer": "B",
        "options": ["A", "B", "C", "D"]
    },
    {
        "id": 3,
        "video_file": "c.mp4",
        "correct_answer": "C",
        "options": ["A", "C", "D", "F"]
    },
    {
        "id": 4,
        "video_file": "d.mp4",
        "correct_answer": "D",
        "options": ["B", "D", "E", "G"]
    }
]

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/home')
def home_page():
    return render_template('home.html')

@app.route('/get_category/<category>', methods=['GET'])
def get_category_videos(category):
    if category in videos_data:
        video_info = videos_data[category]
        return video_info
    else:
        return {"error": "Categoría no encontrada"}, 404

@app.route('/static/videos/<filename>')
def video(filename):
    return send_from_directory('static/videos', filename)

@app.route('/quiz')
def quiz():
    return render_template('quiz.html', questions=quiz_questions)

@app.route('/check_answer', methods=['POST'])
def check_answer():
    data = request.json
    question_id = data['question_id']
    user_answer = data['user_answer']

    question = next((q for q in quiz_questions if q["id"] == question_id), None)
    if not question:
        return jsonify({"error": "Pregunta no encontrada"}), 404

    is_correct = user_answer == question["correct_answer"]

    explanation = ""
    if not is_correct:
        explanation = get_gpt_explanation(question["correct_answer"], user_answer)

    return jsonify({
        "is_correct": is_correct,
        "correct_answer": question["correct_answer"],
        "explanation": explanation
    })

def get_gpt_explanation(correct, user):
    prompt = f"Estoy aprendiendo el lenguaje de señas. Pensé que el gesto mostrado era la letra '{user}', pero era '{correct}'. ¿Por qué me equivoqué?"

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print("❌ Error con Gemini API:", e)
        return "No se pudo generar una explicación automática."

if __name__ == '__main__':
    app.run(debug=True)
