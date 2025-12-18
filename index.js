import { LOCATIONS } from "./locations.js";

console.log("Loaded locations: ", LOCATIONS);

var currentIndex = 0;                // index to keep track of which question we are on
var score = 0;                       // current score
var allowNextQuestionButton = false; // button to allow next question to proceed
var allowGuess = true;               // allows only ONE guess per check
var timerStarted = false;            // start timer only after first click
var timerInterval = null;
var elapsedSeconds = 0;


const answerRectangles = [];         // stores all drawn rectangles
const guessMarkers = [];             // store all guess markers
const guessCircles = [];             // store all circle polygons

const MAX_TIME_FOR_FULL_RED = 20;    // change for time til MAX RED

// randomizes LOCATIONS at start
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); 
        [arr[i], arr[j]] = [arr[j], arr[i]]; // swap
    }
}

// helper method to update question to current Index
function showQuestion() {
    const q = document.getElementById("questionBox");
    const loc = LOCATIONS[currentIndex];
    
    q.textContent = `Click where you think ${LOCATIONS[currentIndex].name} is.`;

    const img = document.getElementById("locationImage");
    if (loc.image) {
        img.src = loc.image;
        img.alt = loc.name;
        img.style.display = "block";
    } else {
        img.style.display = "none";
    }

}

function nextQuestion() {   // calls showQuestion()
  currentIndex++;

  if (currentIndex >= LOCATIONS.length) {
    return false;
  }

  showQuestion();
  return true; // return successful
}

// helper method for checkAnswer; returns true or false, depending on if clickLocation is inside the coordinates
function inBox(clickLocation, upperLeft, upperRight, bottomLeft, bottomRight) {
    // Extract all latitudes and longitudes
    const lats = [upperLeft.lat, upperRight.lat, bottomLeft.lat, bottomRight.lat];
    const lngs = [upperLeft.lng, upperRight.lng, bottomLeft.lng, bottomRight.lng];

    // Find boundaries
    const north = Math.max(...lats);    // ... is the spread operator, allows us to find max or min value in array
    const south = Math.min(...lats);
    const east  = Math.max(...lngs);
    const west  = Math.min(...lngs);


    /* 
    Check if inside bounds by ensuring the 
    clickLocation is above south boundary
    clickLocation is below north boundary
    clickLocation is to the right of west boundary
    clickLocation is to the left of east boundary 
    */
    return (
        clickLocation.lat >= south && clickLocation.lat <= north && clickLocation.lng >= west && clickLocation.lng <= east
    );
}

// returns boolean, true or false depending on if clickLocation is inside box of currentIndex
function checkAnswer(clickLocation){
    const loc = LOCATIONS[currentIndex];
    const c = loc.corners;
    const inside = inBox(
        clickLocation, 
        c.upperLeft, 
        c.upperRight, 
        c.bottomLeft, 
        c.bottomRight
    );
    return inside; 
}

// helper method for drawRectangle()
function cornersToBounds(corners) {
    const lats = [corners.upperLeft.lat, corners.upperRight.lat, corners.bottomLeft.lat, corners.bottomRight.lat];
    const lngs = [corners.upperLeft.lng, corners.upperRight.lng, corners.bottomLeft.lng, corners.bottomRight.lng];

    const north = Math.max(...lats);    // calculates the max value in lats (spread operator)
    const south = Math.min(...lats);    // calculates the min value in lats
    const east  = Math.max(...lngs);    // calculates the max value in lngs
    const west  = Math.min(...lngs);    // calculates the min value in lngs

    return {
        north,
        south,
        east,
        west,
    };
}

function drawAnswerRectangle(innerMap, answer) {
    const loc = LOCATIONS[currentIndex];
    const bounds = cornersToBounds(loc.corners);

    const strokeColor = answer ? "#00FF00" : "#FF0000"; // green or red depending on 'answer' boolean
    const fillColor   = answer ? "#00FF00" : "#FF0000"; // same colors for fill

    const rect = new google.maps.Rectangle({
        map: innerMap,
        bounds,
        strokeColor: strokeColor, 
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: fillColor,
        fillOpacity: 0.25, 
        clickable: false,
    });

    answerRectangles.push(rect); // append to answerRectangles so we can clear later if needed
}

function updateBackgroundByTime() {
    const ratio = Math.min(elapsedSeconds / MAX_TIME_FOR_FULL_RED, 1); // clamp 0–1

    // Start color: #F8F8F8 (248,248,248)
    // End color:   #FF0000 (255,0,0)
    const start = { r: 248, g: 248, b: 248 };
    const end   = { r: 255, g:   0, b:   0 };

    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);

    document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateTimerDisplay() {
    const timerEl = document.getElementById("timer");
    if (timerEl) {
        timerEl.textContent = formatTime(elapsedSeconds);
    }
}

function startTimer() {
    // clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    elapsedSeconds = 0;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        elapsedSeconds++;
        updateTimerDisplay();
        updateBackgroundByTime();
    }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}


// NEXT BUTTON functionality
const nextBtn = document.getElementById("nextBtn");
nextBtn.style.display = "none"; // hide at the start

nextBtn.addEventListener("click", () => {   // calls nextQuestion()
    // Move to next question
    var successful = nextQuestion();

    if(successful){

        allowNextQuestionButton = false; 
        allowGuess = true;

        // Reset feedback box
        document.getElementById("feedbackBox").textContent = "";
        document.getElementById("feedbackBox").className = "feedback-box";

        nextBtn.style.display = "none"; // hide at the start
        document.getElementById("question-number").textContent = currentIndex+1;


    }else{ // means quiz is finished!
        document.getElementById("questionBox").textContent = "Quiz finished!";
        document.getElementById("feedbackBox").textContent = "Thanks for playing!"; // needs to have line 82 changed to work
        document.getElementById("score").textContent = score + "/5";
        document.getElementById("question-number").textContent = "Finished!";

        stopTimer();
    }

    // clear previous marker
    guessMarkers.forEach(marker => {
        if (marker.setMap) marker.setMap(null);
        else marker.map = null;
    });
    guessMarkers.length = 0;

});


// RESET BUTTON functionality
const resetBtn = document.getElementById("resetBtn");
resetBtn.style.display = "none"; // hide at the start

resetBtn.addEventListener("click", () => {
    console.log("Resetting quiz...");

    // Reset values to default
    currentIndex = 0;
    score = 0;
    allowNextQuestionButton = false;
    allowGuess = true;

    // Reset UI elements to default
    document.getElementById("score").textContent = "0";
    document.getElementById("question-number").textContent = "1";
    document.getElementById("feedbackBox").textContent = "";
    document.getElementById("feedbackBox").className = "feedback-box";
    nextBtn.style.display = "none";   
    resetBtn.style.display = "none";  

    // Reshuffle LOCATIONS array
    shuffleArray(LOCATIONS);

    // Clear rectangle(s)
    answerRectangles.forEach(rect => rect.setMap(null));
    answerRectangles.length = 0; // empty the array

    // Clear markers
    guessMarkers.forEach(marker => {
        if (marker.setMap) {
        marker.setMap(null);   // classic Marker
        } else {
        marker.map = null;     // AdvancedMarkerElement
        }
    });
    guessMarkers.length = 0;

    // Clear circles
    guessCircles.forEach(circle => circle.setMap(null));
    guessCircles.length = 0;


    // Show first question again
    showQuestion();
    timerStarted = false;
    stopTimer();
    document.body.style.backgroundColor = "#F8F8F8"; // back to start color
});



async function initMap() {
    // Request the needed libraries.
    const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('marker'),
    ]);

    // Get the gmp-map element.
    const mapElement = document.querySelector('gmp-map');

    // Get the inner map.
    const innerMap = mapElement.innerMap;

    // Set map options.
    innerMap.setOptions({
        mapTypeControl: false,     
        fullscreenControl: false,  
        streetViewControl: false,  
        zoomControl: false,       
        draggable: false,          
        scrollwheel: false,
        disableDoubleClickZoom: true,
        disableDefaultUI: true,
    });

    innerMap.setMapTypeId('satellite'); // sets the map mode to be satellite mode

    google.maps.event.addListenerOnce(innerMap, 'idle', () => {
        console.log("The map is now ready!");
    });

    showQuestion(); // runs only once to show the first question

    
    // code to listen for a double click
    innerMap.addListener("dblclick", (e) => {
        if (!allowGuess){
            console.log("Not allowed to guess, returning");
            return;
        } else {
            allowGuess = false;
            console.log("Guess Registered, calculating....")
        }

        if (!timerStarted) {
            timerStarted = true;
            startTimer();
        }

        const clicked = e.latLng.toJSON(); // converts to {lat, lng}
        const loc = LOCATIONS[currentIndex];


        // create a marker at the clicked point
        const guessMarker = new google.maps.marker.AdvancedMarkerElement({
            map: innerMap,
            position: clicked,
        });
        guessMarkers.push(guessMarker);

        if (checkAnswer(clicked)){  // if answer is correct:
            allowNextQuestionButton = true;
            score++;
            document.getElementById("score").textContent = score;
            document.getElementById("feedbackBox").textContent =  `Correct! That's the correct location of ${loc.name}!`;

            drawAnswerRectangle(innerMap, true);    // draw rectangle that is CORRECT (AKA green)

            // display CONFETTI!!!
            confetti({
                particleCount: 2000,
                spread: 300,
                origin: { y: 0.6 }   // slightly lower on the screen
            });


        } else {                    // if answer is not correct
            allowNextQuestionButton = true;
            document.getElementById("feedbackBox").textContent =  `Incorrect! That wasn't the correct location of  ${loc.name}!`;

            drawAnswerRectangle(innerMap, false);    // draw rectangle that is WRONG (AKA red)

            const circle = new google.maps.Circle({
                map: innerMap,
                center: clicked,
                radius: 40,
                strokeColor: '#FF0000',
                strokeOpacity: 0.25,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.3,
            });

            guessCircles.push(circle);

        }

        nextBtn.style.display = "block"; // show nextButton to progress to next question
        resetBtn.style.display = "block"; // show resetButton

    });
} // end initiMap()


shuffleArray(LOCATIONS);
initMap();
