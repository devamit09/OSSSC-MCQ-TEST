// DOM Elements
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const questionCountEl = document.querySelector('.question-count');
const timerEl = document.querySelector('.timer');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const resultEl = document.getElementById('result');
const backToTopBtn = document.querySelector('.back-to-top');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// Quiz state variables
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = new Array(quizData.length).fill(null);
let time = 0;
let timerInterval;
let touchStartX = 0;
let touchEndX = 0;

// Initialize quiz
function initQuiz() {
    startTimer();
    displayQuestion();
    updateProgressSidebar();
    setupEventListeners();
    checkMobile();
    loadDarkModePreference();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation buttons
    prevBtn.addEventListener('click', prevQuestion);
    nextBtn.addEventListener('click', nextQuestion);
    submitBtn.addEventListener('click', submitQuiz);
    document.getElementById('exit-btn').addEventListener('click', exitQuiz);

    // Touch events for swipe navigation
    optionsEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    optionsEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Back to top button
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Window events
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('scroll', toggleBackToTopButton);

    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

// Handle touch start for swipe
function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

// Handle touch end for swipe
function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

// Handle swipe gesture
function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
        if (currentQuestionIndex < quizData.length - 1) nextQuestion();
    } else if (touchEndX > touchStartX + swipeThreshold) {
        if (currentQuestionIndex > 0) prevQuestion();
    }
}

// Start timer
function startTimer() {
    timerInterval = setInterval(() => {
        time++;
        updateTimerDisplay();
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    timerEl.textContent = window.innerWidth < 480 ? `${minutes}:${seconds}` : `Time: ${minutes}:${seconds}`;
}

// Display current question
function displayQuestion() {
    const question = quizData[currentQuestionIndex];
    questionEl.innerHTML = `${question.id}. ${question.question}`;
    questionCountEl.textContent = `Question ${question.id} of ${quizData.length}`;
    optionsEl.innerHTML = '';

    if (question.statements) {
        const statementsContainer = document.createElement('div');
        statementsContainer.className = 'statements-container';

        question.statements.forEach(statement => {
            const statementEl = document.createElement('div');
            statementEl.className = 'statement';
            statementEl.textContent = statement;
            statementsContainer.appendChild(statementEl);
        });
        optionsEl.appendChild(statementsContainer);
    }

    if (question.tableData) {
        if (window.innerWidth < 768) {
            const tableContainer = document.createElement('div');
            tableContainer.className = 'mobile-table-container';

            question.tableData.rows.forEach(row => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'mobile-table-row';

                row.forEach((cell, i) => {
                    const cellDiv = document.createElement('div');
                    cellDiv.innerHTML = `<span class="mobile-table-header">${question.tableData.headers[i]}:</span> ${cell}`;
                    rowDiv.appendChild(cellDiv);
                });
                tableContainer.appendChild(rowDiv);
            });
            optionsEl.appendChild(tableContainer);
        } else {
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            question.tableData.headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            question.tableData.rows.forEach(rowData => {
                const row = document.createElement('tr');
                rowData.forEach(cellData => {
                    const td = document.createElement('td');
                    td.textContent = cellData;
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            optionsEl.appendChild(table);
        }
    }

    question.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        if (userAnswers[currentQuestionIndex] === index) {
            optionEl.classList.add('selected');
        }
        optionEl.innerHTML = `
            <input type="radio" name="option" id="option-${index}" value="${index}" ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}>
            <label for="option-${index}">${option}</label>
        `;
        optionEl.addEventListener('click', () => selectOption(index));

        if (isTouchDevice()) {
            optionEl.addEventListener('touchstart', () => {
                optionEl.classList.add('option-selected');
            });
            optionEl.addEventListener('touchend', () => {
                setTimeout(() => {
                    optionEl.classList.remove('option-selected');
                }, 200);
            });
        }
        optionsEl.appendChild(optionEl);
    });

    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === quizData.length - 1;
    submitBtn.style.display = currentQuestionIndex === quizData.length - 1 ? 'block' : 'none';

    updateProgressSidebar();
    scrollToQuestion();
}

function selectOption(index) {
    userAnswers[currentQuestionIndex] = index;
    displayQuestion();
}

function nextQuestion() {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function scrollToQuestion() {
    const scrollOptions = {
        behavior: 'smooth',
        block: window.innerWidth < 768 ? 'center' : 'start'
    };
    questionEl.scrollIntoView(scrollOptions);
}

function submitQuiz() {
    clearInterval(timerInterval);
    score = 0;
    quizData.forEach((question, index) => {
        if (userAnswers[index] === question.answer) {
            score++;
        }
    });

    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    resultEl.innerHTML = `
        <h2>Quiz Completed!</h2>
        ${window.innerWidth < 768 ? `
            <div class="result-stats">
                <div><span>Score:</span> ${score}/${quizData.length}</div>
                <div><span>Percentage:</span> ${((score / quizData.length) * 100).toFixed(2)}%</div>
                <div><span>Time:</span> ${minutes}m ${seconds}s</div>
            </div>
        ` : `
            <p>Your score: <strong>${score}/${quizData.length}</strong></p>
            <p>Percentage: <strong>${((score / quizData.length) * 100).toFixed(2)}%</strong></p>
            <p>Time taken: <strong>${minutes}m ${seconds}s</strong></p>
        `}
    `;
    resultEl.style.display = 'block';
    submitBtn.style.display = 'none';
    resultEl.scrollIntoView({ behavior: 'smooth' });

    //Add a Download Button in Result Section
    const downloadBtn = document.createElement("button");
downloadBtn.textContent = "Download Answer Key (PDF)";
downloadBtn.className = "download-btn";
downloadBtn.addEventListener("click", downloadAnswerKey);
resultEl.appendChild(downloadBtn);

}

function updateProgressSidebar() {
    const totalQuestions = quizData.length;
    const answeredQuestions = userAnswers.filter(answer => answer !== null).length;
    const remainingQuestions = totalQuestions - answeredQuestions;

    document.getElementById('total-questions').textContent = totalQuestions;
    document.getElementById('answered-questions').textContent = answeredQuestions;
    document.getElementById('remaining-questions').textContent = remainingQuestions;

    const progressGrid = document.getElementById('progress-grid');
    progressGrid.innerHTML = '';

    quizData.forEach((question, index) => {
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';

        if (index === currentQuestionIndex) {
            progressItem.classList.add('current');
        } else if (userAnswers[index] !== null) {
            progressItem.classList.add('answered');
        } else {
            progressItem.classList.add('unanswered');
        }

        progressItem.style.fontSize = window.innerWidth < 600 ? '12px' : '14px';
        progressItem.style.minWidth = window.innerWidth < 600 ? '24px' : '30px';
        progressItem.style.minHeight = window.innerWidth < 600 ? '24px' : '30px';

        progressItem.textContent = index + 1;
        progressItem.addEventListener('click', () => {
            currentQuestionIndex = index;
            displayQuestion();
        });

        progressGrid.appendChild(progressItem);
    });
}

function exitQuiz() {
    if (confirm('Are you sure you want to exit the quiz? Your progress will be lost.')) {
        window.location.href = '#';
    }
}

function handleResize() {
    displayQuestion();
    checkMobile();
}

function handleOrientationChange() {
    clearTimeout(window.orientationDebounce);
    window.orientationDebounce = setTimeout(() => {
        displayQuestion();
    }, 200);
}

function toggleBackToTopButton() {
    backToTopBtn.style.display = (window.innerWidth < 768 && window.scrollY > 300) ? 'block' : 'none';
}

function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints;
}

function checkMobile() {
    if (window.innerWidth < 768) {
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
    if (isTouchDevice()) {
        document.body.classList.add('touch-device');
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.removeItem('darkMode');
    }
}

function loadDarkModePreference() {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
}

document.addEventListener('DOMContentLoaded', initQuiz);

// function downloadAnswerKey() {
//     let content = "Quiz Answer Key\n\n";
    
//     quizData.forEach((question, index) => {
//       content += `Q${index + 1}. ${question.question}\n`;
//       question.options.forEach((opt, i) => {
//         const marker = i === question.answer ? "(✓ Correct)" : "";
//         const selected = userAnswers[index] === i ? "[Selected]" : "";
//         content += `   ${String.fromCharCode(65 + i)}. ${opt} ${selected} ${marker}\n`;
//       });
//       content += "\n";
//     });
  
//     const blob = new Blob([content], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
  
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "quiz-answer-key.txt";
//     a.click();
  
//     URL.revokeObjectURL(url);
//   }


async function downloadAnswerKey() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    doc.setFontSize(14);
    doc.text("Quiz Answer Key", 10, 15);
    doc.setFontSize(11);
  
    let y = 25;
  
    quizData.forEach((question, index) => {
      const qText = `Q${index + 1}. ${question.question}`;
      doc.text(qText, 10, y);
      y += 6;
  
      question.options.forEach((option, i) => {
        const marker = i === question.answer ? "(✓ Correct)" : "";
        const selected = userAnswers[index] === i ? "[Selected]" : "";
        const line = `   ${String.fromCharCode(65 + i)}. ${option} ${selected} ${marker}`;
        doc.text(line, 12, y);
        y += 6;
      });
  
      y += 4;
  
      // If space exceeds page height, add new page
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  
    doc.save("quiz-answer-key.pdf");
  }
  
  
