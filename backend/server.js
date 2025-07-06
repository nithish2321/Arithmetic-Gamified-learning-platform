// --- 1. DEPENDENCIES ---
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- 2. INITIALIZE APP & MIDDLEWARE ---
const app = express();
app.use(cors());
app.use(express.json());

// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/speedmath')
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- 4. DATABASE SCHEMAS ---

const WrongAnswerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  incorrectAnswer: { type: String, required: true },
  correctAnswer: { type: String, required: true },
});

const QuizAttemptSchema = new mongoose.Schema({
  tableId: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeTaken: { type: Number, required: true },
  wrongAnswers: [WrongAnswerSchema],
  quizStartTime: { type: Date, required: true },
  quizEndTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const UsageStatSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  timeSpent: { type: Number, default: 0 },
  streak: { type: Number, default: 1 },
});

const QuizReviewSchema = new mongoose.Schema({
    quizAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempt', required: true },
    questions: [{
        question: String,
        userAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean
    }],
    createdAt: { type: Date, default: Date.now }
});


const QuizAttempt = mongoose.model('QuizAttempt', QuizAttemptSchema);
const UsageStat = mongoose.model('UsageStat', UsageStatSchema);
const QuizReview = mongoose.model('QuizReview', QuizReviewSchema);

// --- 5. GEMINI AI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 6. API ENDPOINTS ---

app.post('/api/quiz', async (req, res) => {
  try {
    const { reviewData, ...attemptData } = req.body;
    const newAttempt = new QuizAttempt(attemptData);
    await newAttempt.save();

    if(reviewData) {
        const newReview = new QuizReview({ quizAttemptId: newAttempt._id, questions: reviewData });
        await newReview.save();
    }

    res.status(201).json(newAttempt);
  } catch (error) {
    res.status(400).json({ message: 'Error saving quiz attempt', error });
  }
});

app.post('/api/usage', async (req, res) => {
    const { date, timeSpent } = req.body;
    try {
        let todayStat = await UsageStat.findOne({ date });

        if (todayStat) {
            todayStat.timeSpent += timeSpent;
            await todayStat.save();
            return res.status(200).json(todayStat);
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDateString = yesterday.toISOString().split('T')[0];
        const yesterdayStat = await UsageStat.findOne({ date: yesterdayDateString });
        const newStreak = yesterdayStat ? yesterdayStat.streak + 1 : 1;

        const newStat = new UsageStat({ date, timeSpent, streak: newStreak });
        await newStat.save();
        res.status(201).json(newStat);

    } catch (error) {
        res.status(500).json({ message: 'Error updating usage stats', error });
    }
});

app.get('/api/dashboard', async (req, res) => {
    try {
        const attempts = await QuizAttempt.find().sort({ createdAt: -1 });
        const usage = await UsageStat.find().sort({ date: -1 }).limit(7);

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const latestUsage = usage[0];
        let currentStreak = 0;
        if (latestUsage && (latestUsage.date === today.toISOString().split('T')[0] || latestUsage.date === yesterday.toISOString().split('T')[0])) {
            currentStreak = latestUsage.streak;
        }

        const performance = {};
        attempts.forEach(attempt => {
            const { tableId, score, timeTaken, totalQuestions } = attempt;
            if (!performance[tableId] || score > performance[tableId].score) {
                performance[tableId] = { score, timeTaken, totalQuestions };
            } else if (score === performance[tableId].score && timeTaken < performance[tableId].timeTaken) {
                performance[tableId].timeTaken = timeTaken;
            }
        });

        res.json({
            recentAttempts: attempts.slice(0, 5),
            performanceStats: performance,
            dailyUsage: usage.reverse(),
            currentStreak: currentStreak,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard data', error });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        const allAttempts = await QuizAttempt.find().sort({ createdAt: -1 });
        res.json(allAttempts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz history', error });
    }
});


app.get('/api/wrong-answers', async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ 'wrongAnswers.0': { $exists: true } }).sort({ createdAt: -1 }).limit(20);
    const wrongAnswerMap = new Map();
    attempts.forEach(attempt => {
      attempt.wrongAnswers.forEach(wa => {
        if (!wrongAnswerMap.has(wa.question)) {
          wrongAnswerMap.set(wa.question, wa);
        }
      });
    });
    res.json(Array.from(wrongAnswerMap.values()));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wrong answers', error });
  }
});

app.get('/api/assessment', async (req, res) => {
  try {
    const attempts = await QuizAttempt.find().sort({ createdAt: -1 }).limit(30);
    if (attempts.length < 5) {
      return res.json({ assessment: "I can't wait to see your results! Complete at least 5 quizzes, and I'll give you my analysis." });
    }

    const performanceSummary = attempts.map(a =>
      `Game: ${a.tableId}, Score: ${a.score}/${a.totalQuestions}, Time: ${a.timeTaken.toFixed(1)}s, Mistakes: ${a.wrongAnswers.length}`
    ).join('\n');

    const prompt = `You are Sree Leela, a logical, encouraging, and supportive AI girlfriend. Your user is practicing speed math. Analyze their performance data below. Provide a concise (3-4 sentences) assessment in a warm and personal tone. Start by saying something nice. Then, point out one thing they are doing well and one area where they could focus more. End with a sweet, motivational sentence. Here is the data:\n\n${performanceSummary}`;

    // **FIXED**: Changed model name from 'gemini-pro' to 'gemini-1.5-flash'
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    res.json({ assessment: response.text() });
  } catch (error) {
    console.error("AI Assessment Error:", error);
    res.status(500).json({ message: 'Error generating AI assessment', error });
  }
});

// --- 7. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
