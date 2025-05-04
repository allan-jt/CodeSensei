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
      
      
      // Display assessment info and show the start button
      document.getElementById("assessment-form-container").style.display = "none";
      document.getElementById("assessment-info").style.display = "block";
      
      // Show assessment details
      document.getElementById("assessment-details").innerHTML = `
        <p><strong>Assessment ID:</strong> ${data.id}</p>
        <p><strong>Topics:</strong> ${selectedTopics.join(", ")}</p>
        <p><strong>Number of Questions:</strong> ${numQuestions}</p>
        <p><strong>Difficulty:</strong> ${difficulty}</p>
      `;
      
    } catch (err) {
      console.error(err);
      document.getElementById("response").innerText = "Error: " + err.message;
      submitButton.disabled = false;
    }
  });
  
 // Start Assessment button click handler
document.getElementById("start-assessment").addEventListener("click", async function() {
    try {
      const userId = sessionStorage.getItem("assessmentUserId");
      const timestamp = sessionStorage.getItem("assessmentTimestamp");
      
      if (!userId || !timestamp) {
        throw new Error("Assessment details not found. Please start a new assessment.");
      }
      
      // Format the ID as userId:timestamp
      const assessmentId = `${userId}:${timestamp}`;
      
      // Call the /start endpoint with GET method
      const encodedId = encodeURIComponent(assessmentId);
        const response = await fetch(`https://nrrtze58o7.execute-api.us-east-1.amazonaws.com/prod/assessments/${encodedId}/start`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
        });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const assessmentData = await response.json();
      console.log("Assessment started:", assessmentData);
      
      // Display the question interface
      document.getElementById("assessment-info").style.display = "none";
      document.getElementById("question-container").style.display = "block";
      
      // Set initial question information using data from the API
      document.getElementById("question-progress").innerText = "Question 1 of " + assessmentData.numQuestions;
      document.getElementById("question-topic").innerText = "Topic: " + 
        (assessmentData.topics.length > 0 ? assessmentData.topics[0] : "General");
      document.getElementById("question-difficulty").innerText = "Difficulty: " + assessmentData.difficulty;
      document.getElementById("question-content").innerHTML = 
        "<p>Your assessment is ready to begin. This is where questions will appear.</p>";
      
      // Initialize the current question index
      sessionStorage.setItem("currentQuestionIndex", "0");
      
    } catch (err) {
      console.error(err);
      document.getElementById("question-error").innerText = "Error starting assessment: " + err.message;
    }
  });
  
  // Handle "Next Question" button click
  document.getElementById("next-question").addEventListener("click", function() {
    // For now, just simulate advancing through questions
    const currentIndex = parseInt(sessionStorage.getItem("currentQuestionIndex") || "0");
    const totalQuestions = parseInt(sessionStorage.getItem("totalQuestions") || "0");
    const nextIndex = currentIndex + 1;
    
    sessionStorage.setItem("currentQuestionIndex", nextIndex.toString());
    
    if (nextIndex < totalQuestions) {
      // Update question display for next question
      document.getElementById("question-progress").innerText = `Question ${nextIndex + 1} of ${totalQuestions}`;
      document.getElementById("question-content").innerHTML = `<p>This is a placeholder for question ${nextIndex + 1}.</p>`;
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
    document.getElementById("assessment-info").style.display = "none";
    document.getElementById("question-container").style.display = "none";
    document.getElementById("assessment-complete").style.display = "none";
    
    // Reset the form
    document.getElementById("assessment-form").reset();
    document.getElementById("response").innerText = "";
    
    // Enable the submit button
    document.querySelector('button[type="submit"]').disabled = false;
  });