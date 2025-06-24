// Función para cargar el video de la categoría seleccionada
function loadCategoryVideo(category) {
    fetch(`/get_category/${category}`)
        .then(response => response.json())
        .then(data => {
            if (data.video_file) {
                const chatMessages = document.getElementById('chatMessages');

                // Mostrar mensaje del usuario
                chatMessages.innerHTML += `<div class="message user-message">Quiero aprender sobre ${data.title}</div>`;

                // Agregar mensaje de "Escribiendo..."
                const typingId = `typing-${Date.now()}`;
                chatMessages.innerHTML += `<div class="message assistant-message" id="${typingId}">Escribiendo<span id="${typingId}-dots">.</span></div>`;
                chatMessages.scrollTop = chatMessages.scrollHeight; // Asegura que el scroll esté al final después de agregar el mensaje del usuario

                // Animación de puntos suspensivos
                const dotsElement = document.getElementById(`${typingId}-dots`);
                let dotCount = 1;
                const dotInterval = setInterval(() => {
                    dotCount = (dotCount % 3) + 1;
                    dotsElement.textContent = '.'.repeat(dotCount);
                }, 500);

                // Esperar 1.5 segundos y luego mostrar el mensaje real + video
                setTimeout(() => {
                    clearInterval(dotInterval); // Detener la animación

                    // Reemplazar "Escribiendo..." por el mensaje real
                    const typingElement = document.getElementById(typingId);
                    if (typingElement) {
                        typingElement.innerHTML = data.title;
                    }

                    // Insertar el video debajo del mensaje del asistente
                    const videoEmbed = `
                        <div class="video-container" id="videoContainer">
                            <video controls>
                                <source src="/static/videos/${data.video_file}" type="video/mp4">
                                Tu navegador no soporta el formato de video.
                            </video>
                        </div>
                    `;
                    chatMessages.innerHTML += videoEmbed;  // Insertar el video en el flujo del chat

                    // Mostrar botón de limpieza
                    document.getElementById('backToHome').style.display = 'inline-block';

                    // Desplazar al final para mostrar tanto el mensaje del asistente como el video
                    chatMessages.scrollTop = chatMessages.scrollHeight; // Esto asegura que el scroll se desplace al final

                }, 1500); // 1.5 segundos para simular la espera antes de mostrar la respuesta real + video
            } else {
                alert("No se encontró el video para esta categoría.");
            }
        })
        .catch(error => {
            console.error("Error al cargar el video:", error);
        });
}

// Función para recargar la página (volver al inicio)
function reloadPage() {
    location.reload();
}

// Función para alternar el modo daltonismo
let colorBlindMode = false;

function toggleColorBlindMode() {
    colorBlindMode = !colorBlindMode;

    // Cambia clase general al body (si quieres efectos globales)
    document.body.classList.toggle('color-blind-mode');

    // A todos los botones del quiz
    const quizButtons = document.querySelectorAll('.quiz-option');
    quizButtons.forEach(btn => {
        if (colorBlindMode) {
            btn.classList.add('color-blind');
        } else {
            btn.classList.remove('color-blind');
        }
    });

    // También aplica al botón "Pasar a la siguiente pregunta"
    const nextBtn = document.getElementById('next-button');
    if (colorBlindMode) {
        nextBtn.classList.add('color-blind');
    } else {
        nextBtn.classList.remove('color-blind');
    }
}


function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const isActive = content.classList.contains('active');

    // Cierra todos
    document.querySelectorAll('.accordion-content').forEach(el => el.classList.remove('active'));

    // Si no estaba activo, lo abrimos
    if (!isActive) {
        content.classList.add('active');
    }
}


let current = 0;
let score = 0;

function loadQuestion() {
    const q = questions[current];
    document.getElementById('video').src = `/static/videos/quiz/${q.video_file}`;
    document.getElementById('options').innerHTML = '';
    document.getElementById('feedback').innerHTML = '';
    const nextBtn = document.getElementById('next-button');
    nextBtn.style.display = 'none';
    nextBtn.innerText = '➡️ Pasar a la siguiente pregunta';
    nextBtn.onclick = nextQuestion;

    // 🔤 Mostrar opciones con literal (A, B, C, D) y mantener disposición horizontal
    q.options.forEach((opt, index) => {
        const button = document.createElement('button');
        const literal = String.fromCharCode(65 + index); // A, B, C, D...
        button.innerText = `${literal}) Letra ${opt}`;
        button.classList.add('quiz-option');
        button.style.margin = '5px'; // Espacio entre botones
        button.onclick = () => submitAnswer(opt);
        document.getElementById('options').appendChild(button);
    });

    document.getElementById('progress').innerText = `Pregunta ${current + 1} de ${questions.length}`;
}

function submitAnswer(answer) {
    const q = questions[current];
    fetch('/check_answer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            question_id: q.id,
            user_answer: answer
        })
    })
    .then(res => res.json())
    .then(data => {
        const feedbackDiv = document.getElementById('feedback');
        if (data.is_correct) {
            score++;
            feedbackDiv.innerHTML = `<p style="color: green;">✅ ¡Correcto!</p>`;
        } else {
            feedbackDiv.innerHTML = `
                <p style="color: red;">❌ Incorrecto. Respuesta correcta: <strong>${data.correct_answer}</strong></p>
                <p>💡 <em>Explicación:</em> ${data.explanation}</p>
            `;
        }

        const buttons = document.querySelectorAll('#options button');
        buttons.forEach(btn => btn.disabled = true);

        const nextBtn = document.getElementById('next-button');
        nextBtn.style.display = 'inline-block';

        if (current === questions.length - 1) {
            nextBtn.innerText = '🔁 Reiniciar quiz';
            nextBtn.onclick = () => location.reload();
        }
    });
}

function nextQuestion() {
    current++;
    if (current < questions.length) {
        loadQuestion();
    }
}

window.onload = loadQuestion;
