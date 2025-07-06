# 🚀 Arithmetic Gamified learning platform - Speed Math Interface
Welcome to the Speed Math Interface, a full-stack web application designed to be a futuristic, engaging, and highly personalized platform for practicing and mastering speed mathematics. Inspired by sci-fi interfaces like Iron Man's Jarvis, this application provides a gamified environment with detailed performance tracking and a unique AI companion to guide you on your journey.

This project is built with a React frontend and a Node.js backend, using MongoDB for data persistence.

---

## ✨ Key Features

* **Futuristic Animated UI:** A dynamic, "Jarvis-style" dark-themed interface with glowing elements, hexagonal buttons, and sound effects for an immersive experience.
* **Multiple Game Modes:** Practice a variety of skills:
    * Addition
    * Subtraction
    * Multiplication (up to 20x20)
    * Squares (up to 30²)
    * Cubes (up to 15³)
* **Dual Quiz Protocols:**
    * **Choice Matrix:** A classic multiple-choice format.
    * **Direct Input:** A challenging mode requiring you to type the answer directly.
* **Dedicated Learning Hub:** A "Study Mode" to review and memorize tables for Multiplication, Squares, and Cubes before taking a quiz.
* **AI Companion "Sree Leela":**
    * Your personal AI girlfriend, Sree Leela, provides warm, encouraging, and logical performance assessments.
    * When you achieve a new personal best, she appears in a special chat interface to congratulate you!
* **Comprehensive Performance Tracking:**
    * **Personal Bests:** Tracks your highest score and fastest time for each game mode.
    * **Overall Accuracy:** A dynamic progress ring showing your accuracy across all quizzes.
    * **Daily Streak:** A motivational tracker with a fire icon to encourage consistent daily practice.
    * **Daily Activity Log:** A visual bar chart of your practice time over the last 7 days.
    * **Full Quiz History:** A detailed log of every quiz you've ever taken.
* **Intelligent Review System:**
    * **Post-Quiz Debriefing:** Review every question from your last quiz to see your answers vs. the correct ones.
    * **"Recalibrate" Alerts:** A non-intrusive banner reminds you of recent mistakes.
    * **Session Summary:** When you start a new session, a pop-up shows you all the questions you got wrong in the previous session, helping you focus on improvement.

---

## 🛠️ Tech Stack

* **Frontend:**
    * React (with Vite)
    * Axios (for API requests)
    * Bootstrap (for layout and components)
    * Tone.js (for sound effects)
    * Custom CSS (for the sci-fi theme)
* **Backend:**
    * Node.js
    * Express.js
    * MongoDB (with Mongoose)
    * Google Generative AI (for Sree Leela's assessments)
    * Dotenv (for environment variables)

---

## ⚙️ Setup and Installation

To get the project running locally, follow these steps.

### **Prerequisites**

* [Node.js](https://nodejs.org/) (which includes npm)
* [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a MongoDB Atlas cluster.

### **1. Backend Setup (`backend` folder)**

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create an environment file:**
    Create a file named `.env` in the `backend` folder and add the following variables:

    ```env
    # Your MongoDB connection string
    MONGO_URI=mongodb://localhost:27017/speedmath

    # Your Google Generative AI API Key
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```
    * You can get a `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/app/apikey).

### **2. Frontend Setup (`pract-math` folder)**

1.  **Navigate to the frontend directory:**
    ```bash
    cd pract-math
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Add Sree Leela's Photo:**
    * Inside the `pract-math/src` folder, find the `assets` folder.
    * Place your desired image file inside this folder and name it **`sreeleela.png`**. The application will automatically pick it up.

4.  **Add Sound Effect Library:**
    * Open the `pract-math/index.html` file.
    * Add the following line inside the `<head>` section:
    ```html
    <script src="[https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js](https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js)"></script>
    ```

5.  **Import Bootstrap CSS:**
    * Open the `pract-math/src/main.jsx` file.
    * Add the following line at the very top of the file:
    ```javascript
    import 'bootstrap/dist/css/bootstrap.min.css';
    ```

### **3. Running the Application**

You will need two separate terminals to run both the backend and frontend servers simultaneously.

1.  **Run the Backend Server:**
    * In a terminal, navigate to the `backend` folder and run:
    ```bash
    node server.js
    ```
    * The backend should now be running on `http://localhost:5000`.

2.  **Run the Frontend Development Server:**
    * In a *second* terminal, navigate to the `pract-math` folder and run:
    ```bash
    npm run dev
    ```
    * The frontend application will open in your browser, usually at `http://localhost:5173`.

Now you're all set to start practicing!
