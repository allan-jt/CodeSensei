document.getElementById("assessment-form").addEventListener("submit", async function(e) {
    e.preventDefault();
  
    // Disable the submit button to prevent multiple submissions
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    
    const selectedTopics = Array.from(document.getElementById("topics").selectedOptions)
                                .map(opt => opt.value);
    const numQuestions = parseInt(document.getElementById("num-questions").value);
    const difficulty = document.getElementById("difficulty").value;
  
    const payload = {
      topics: selectedTopics,
      num_questions: numQuestions,
      difficulty: difficulty
    };
  
    try {
      // Step 1: Create a new assessment
      const response = await fetch("https://nrrtze58o7.execute-api.us-east-1.amazonaws.com/prod/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      
      // Store assessment details in session storage for persistence
      sessionStorage.setItem("assessmentUserId", data.userId);
      sessionStorage.setItem("assessmentTimestamp", data.timestamp);
      sessionStorage.setItem("currentQuestionIndex", "0");
      sessionStorage.setItem("totalQuestions", numQuestions.toString());
      
      // Hide the form and show the question container
      document.getElementById("assessment-form-container").style.display = "none";
      document.getElementById("question-container").style.display = "block";
      
      // Load the first question
      await loadQuestion(0);
      
    } catch (err) {
      console.error(err);
      document.getElementById("response").innerText = "Error: " + err.message;
      submitButton.disabled = false;
    }
  });
  
  // Function to load a question by index
  async function loadQuestion(index) {
    try {
      const userId = sessionStorage.getItem("assessmentUserId");
      const timestamp = sessionStorage.getItem("assessmentTimestamp");
      
      if (!userId || !timestamp) {
        throw new Error("Assessment details not found. Please start a new assessment.");
      }
      
      const response = await fetch(`https://nrrtze58o7.execute-api.us-east-1.amazonaws.com/prod/assessments/${userId}/${timestamp}/questions/${index}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const questionData = await response.json();
      
      // Update the question display
      document.getElementById("question-content").innerHTML = questionData.content;
      document.getElementById("question-topic").innerText = `Topic: ${questionData.topic}`;
      document.getElementById("question-difficulty").innerText = `Difficulty: ${questionData.difficulty}`;
      document.getElementById("question-progress").innerText = `Question ${index + 1} of ${questionData.total_questions}`;
      
      // Update the options list if applicable
      const optionsContainer = document.getElementById("question-options");
      optionsContainer.innerHTML = "";
      
      if (questionData.options && questionData.options.length > 0) {
        questionData.options.forEach((option, i) => {
          const optionEl = document.createElement("div");
          optionEl.className = "option";
          optionEl.innerHTML = `
            <input type="radio" name="answer" id="option-${i}" value="${i}">
            <label for="option-${i}">${option.text}</label>
          `;
          optionsContainer.appendChild(optionEl);
        });
      }
      
      // Update current index in session storage
      sessionStorage.setItem("currentQuestionIndex", index.toString());
      
    } catch (err) {
      console.error(err);
      document.getElementById("question-error").innerText = "Error: " + err.message;
    }
  }
  
  // Handle "Next Question" button click
  document.getElementById("next-question").addEventListener("click", async function() {
    const currentIndex = parseInt(sessionStorage.getItem("currentQuestionIndex") || "0");
    const totalQuestions = parseInt(sessionStorage.getItem("totalQuestions") || "0");
    
    if (currentIndex + 1 < totalQuestions) {
      await loadQuestion(currentIndex + 1);
    } else {
      // End of assessment
      document.getElementById("question-container").style.display = "none";
      document.getElementById("assessment-complete").style.display = "block";
    }
  });
  
  // Handle "Start New Assessment" button click
  document.getElementById("start-new").addEventListener("click", function() {
    // Clear session storage
    sessionStorage.removeItem("assessmentUserId");
    sessionStorage.removeItem("assessmentTimestamp");
    sessionStorage.removeItem("currentQuestionIndex");
    sessionStorage.removeItem("totalQuestions");
    
    // Show the form and hide other containers
    document.getElementById("assessment-form-container").style.display = "block";
    document.getElementById("question-container").style.display = "none";
    document.getElementById("assessment-complete").style.display = "none";
    
    // Reset the form
    document.getElementById("assessment-form").reset();
    document.getElementById("response").innerText = "";
    
    // Enable the submit button
    document.querySelector('button[type="submit"]').disabled = false;
  });