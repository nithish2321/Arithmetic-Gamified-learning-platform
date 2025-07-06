// ============================================================================
// Speed Math Platform - Frontend Application (App.jsx) - Sree Leela Edition
// ============================================================================
//
// **IMPORTANT SETUP INSTRUCTION:**
// 1. To make the UI look correct, you MUST import the Bootstrap CSS file.
//    Open `src/main.jsx` and add this line at the top:
//    import 'bootstrap/dist/css/bootstrap.min.css';
//
// 2. To enable sound effects, add this script tag to your `index.html` file, in the `<head>` section:
//    <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js"></script>
//
// 3. To add Sree Leela's photo, place an image named `sreeleela.png`
//    inside the `src/assets` folder of your project.
//
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import sreeleelaProfilePic from './assets/sreeleela.png'; // Import the image

// --- Configuration ---
const API_URL = 'http://localhost:5000/api';
const USAGE_TRACKING_INTERVAL = 10000;
const FREQUENT_TEST_INTERVAL = 30000;

const GAME_CONFIG = {
    addition: { name: 'Addition', icon: '➕', questions: 25 },
    subtraction: { name: 'Subtraction', icon: '➖', questions: 25 },
    multiplication: { name: 'Multiplication', icon: '✖️', questions: 50 },
    squares: { name: 'Squares', icon: 'x²', questions: 30 },
    cubes: { name: 'Cubes', icon: 'x³', questions: 15 },
};

// --- Helper Functions ---
const generateQuestions = (game) => {
    let questions = new Set();
    const targetCount = GAME_CONFIG[game].questions;
    while (questions.size < targetCount) {
        let q, a;
        switch (game) {
            case 'multiplication':
                const m1 = Math.floor(Math.random() * 19) + 2; const m2 = Math.floor(Math.random() * 20) + 1;
                q = `${m1} × ${m2}`; a = m1 * m2; break;
            case 'squares':
                const s = Math.floor(Math.random() * 30) + 1;
                q = `${s}²`; a = s * s; break;
            case 'cubes':
                const c = Math.floor(Math.random() * 15) + 1;
                q = `${c}³`; a = c * c * c; break;
            case 'addition':
                const a1 = Math.floor(Math.random() * 90) + 10; const a2 = Math.floor(Math.random() * 90) + 10;
                q = `${a1} + ${a2}`; a = a1 + a2; break;
            case 'subtraction':
                const sub1 = Math.floor(Math.random() * 80) + 20; const sub2 = Math.floor(Math.random() * (sub1 - 10)) + 10;
                q = `${sub1} - ${sub2}`; a = sub1 - sub2; break;
            default: q = '1+1'; a = 2;
        }
        questions.add(JSON.stringify({ q, a }));
    }
    return Array.from(questions).map(item => JSON.parse(item));
};

const formatTime = (seconds, showSeconds = true) => {
    if (isNaN(seconds) || seconds < 0) return '0s';
    const totalSeconds = Math.round(seconds);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    let timeStr = '';
    if (h > 0) timeStr += `${h}h `;
    if (m > 0) timeStr += `${m}m `;
    if (s >= 0 && showSeconds) timeStr += `${s}s`;
    return timeStr.trim() || (showSeconds ? '0s' : '0m');
};

// --- Main App Component ---
function App() {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'quiz', 'review', 'learn', 'history'
    const [quizSettings, setQuizSettings] = useState(null);
    const [learnSettings, setLearnSettings] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [frequentTest, setFrequentTest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [aiAssessment, setAiAssessment] = useState({ text: 'Loading AI Coach...', loading: true });
    const [lastQuizReview, setLastQuizReview] = useState(null);
    const [visualFeedback, setVisualFeedback] = useState(null);
    const [sessionWrongAnswers, setSessionWrongAnswers] = useState([]);
    const [lastSessionSummary, setLastSessionSummary] = useState(null);
    const [newHighScoreInfo, setNewHighScoreInfo] = useState(null);


    // --- Sound Effects ---
    const sfx = useMemo(() => {
        if (window.Tone) {
            return {
                correct: new window.Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination(),
                incorrect: new window.Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 } }).toDestination(),
                click: new window.Tone.MembraneSynth().toDestination(),
                newRecord: new window.Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.2, decay: 0.5, sustain: 0.3, release: 0.8 } }).toDestination(),
            };
        }
        return null;
    }, []);

    const playSound = (sound) => {
        if (sfx && window.Tone.context.state !== 'running') {
            window.Tone.start();
        }
        if (sfx) {
            if (sound === 'correct') sfx.correct.triggerAttackRelease('C5', '8n');
            if (sound === 'incorrect') sfx.incorrect.triggerAttackRelease('C3', '8n');
            if (sound === 'click') sfx.click.triggerAttackRelease('C2', '8n');
            if (sound === 'newRecord') sfx.newRecord.triggerAttackRelease('G5', '2n');
        }
    };
    
    const triggerVisualFeedback = (type) => {
        setVisualFeedback(type);
        setTimeout(() => setVisualFeedback(null), 300);
    }

    const fetchData = useCallback(async () => {
        try {
            const dashRes = await axios.get(`${API_URL}/dashboard`);
            setDashboardData(dashRes.data);
        } catch (error) { console.error("Failed to fetch dashboard data:", error); }
        finally { setIsLoading(false); }
    }, []);

    const fetchAssessment = useCallback(async () => {
        setAiAssessment({ text: "Thinking...", loading: true });
        try {
            const res = await axios.get(`${API_URL}/assessment`);
            setAiAssessment({ text: res.data.assessment, loading: false });
        } catch (error) { setAiAssessment({ text: "I couldn't connect to my thoughts right now. Try again in a bit!", loading: false }); }
    }, []);

    // Effect for initial data load and setting up intervals
    useEffect(() => {
        const savedSummary = localStorage.getItem('lastSessionSummary');
        if (savedSummary) {
            setLastSessionSummary(JSON.parse(savedSummary));
        }
        fetchData();
        fetchAssessment();
        const usageInterval = setInterval(() => {
            const today = new Date().toISOString().split('T')[0];
            axios.post(`${API_URL}/usage`, { date: today, timeSpent: USAGE_TRACKING_INTERVAL / 1000 });
        }, USAGE_TRACKING_INTERVAL);
        const testInterval = setInterval(() => {
            setView(currentView => {
                if (currentView !== 'quiz') {
                    axios.get(`${API_URL}/wrong-answers`).then(res => {
                        if (res.data.length > 0) {
                             const randomQuestion = res.data[Math.floor(Math.random() * res.data.length)];
                             setFrequentTest(randomQuestion);
                        }
                    });
                }
                return currentView;
            });
        }, FREQUENT_TEST_INTERVAL);
        return () => { clearInterval(usageInterval); clearInterval(testInterval); };
    }, [fetchData, fetchAssessment]);

    // Effect for saving session summary on exit
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (sessionWrongAnswers.length > 0) {
                localStorage.setItem('lastSessionSummary', JSON.stringify(sessionWrongAnswers));
            } else {
                localStorage.removeItem('lastSessionSummary');
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => { window.removeEventListener('beforeunload', handleBeforeUnload); };
    }, [sessionWrongAnswers]);


    const handleQuizStart = (settings) => { playSound('click'); setQuizSettings(settings); setView('quiz'); };
    const handleLearnStart = (settings) => { playSound('click'); setLearnSettings(settings); setView('learn'); };
    const handleHistoryStart = () => { playSound('click'); setView('history'); };
    const handleExitSubView = () => { playSound('click'); setView('dashboard'); setLearnSettings(null); setLastQuizReview(null); setNewHighScoreInfo(null); };

    const handleQuizComplete = async (result) => {
        if (result.wrongAnswers.length > 0) {
            setSessionWrongAnswers(prev => [...prev, ...result.wrongAnswers]);
        }
        
        const personalBests = dashboardData?.performanceStats || {};
        const gameBest = personalBests[result.tableId];
        const isNewRecord = !gameBest || result.score > gameBest.score || (result.score === gameBest.score && result.timeTaken < gameBest.timeTaken);

        if (isNewRecord && result.score > 0) {
            playSound('newRecord');
            setNewHighScoreInfo({
                gameName: GAME_CONFIG[result.tableId].name,
                score: result.score,
                total: result.totalQuestions,
                time: result.timeTaken
            });
        }

        setLastQuizReview(result.reviewData);
        setView('review');
        setIsLoading(true);
        await axios.post(`${API_URL}/quiz`, result);
        await fetchData();
        await fetchAssessment();
    };

    const closeLastSessionSummary = () => {
        playSound('click');
        localStorage.removeItem('lastSessionSummary');
        setLastSessionSummary(null);
    };

    const isModalActive = view === 'quiz' || lastSessionSummary !== null || newHighScoreInfo !== null;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
                @keyframes flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes border-glow {
                    0% { box-shadow: 0 0 5px var(--primary-glow), inset 0 0 5px var(--primary-glow); }
                    50% { box-shadow: 0 0 20px var(--primary-glow), inset 0 0 10px var(--primary-glow); }
                    100% { box-shadow: 0 0 5px var(--primary-glow), inset 0 0 5px var(--primary-glow); }
                }
                @keyframes flash-correct { 0%, 100% { background: transparent; } 50% { background: rgba(0, 255, 132, 0.3); } }
                @keyframes flash-incorrect { 0%, 100% { background: transparent; } 50% { background: rgba(255, 42, 109, 0.3); } }

                :root {
                    --bg-color: #020a1a;
                    --primary-glow: #00d9ff;
                    --secondary-glow: #ff00c1;
                    --success-glow: #00ff84;
                    --danger-glow: #ff2a6d;
                    --warning-glow: #ffc107;
                    --text-color: #cceeff;
                    --text-bright: #ffffff;
                    --text-muted: #a2c8e0;
                    --card-bg: rgba(2, 34, 62, 0.7);
                    --border-color: rgba(0, 217, 255, 0.3);
                }
                body { background-color: var(--bg-color); color: var(--text-bright); font-family: 'Orbitron', sans-serif; }
                .app-container.modal-active > .main-content { filter: blur(8px); transform: scale(0.98); transition: all 0.3s ease; }
                .main-header { background: var(--card-bg); border-bottom: 1px solid var(--border-color); text-shadow: 0 0 5px var(--primary-glow); }
                .card {
                    background: var(--card-bg); border: 1px solid var(--border-color);
                    box-shadow: 0 0 10px rgba(0, 217, 255, 0.2), inset 0 0 5px rgba(0, 217, 255, 0.1);
                    backdrop-filter: blur(10px); transition: all 0.3s ease; animation: slideIn 0.5s ease-out; border-radius: 0.75rem;
                }
                .card:hover { border-color: var(--primary-glow); box-shadow: 0 0 20px rgba(0, 217, 255, 0.5); }
                .hex-btn {
                    position: relative; background-color: var(--card-bg); border: 1px solid var(--primary-glow); color: var(--primary-glow);
                    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
                    transition: all 0.3s ease; padding: 12px 30px; text-shadow: 0 0 5px var(--primary-glow); font-size: 1.1rem;
                }
                .hex-btn.active, .hex-btn:hover { background-color: var(--primary-glow); color: var(--bg-color); text-shadow: none; }
                .btn-initiate {
                    background: transparent; color: var(--warning-glow); font-weight: bold;
                    border: 2px solid var(--warning-glow); box-shadow: 0 0 15px var(--warning-glow);
                }
                .btn-initiate:hover { background: var(--warning-glow); color: var(--bg-color); }
                .modal-backdrop-custom { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1040; backdrop-filter: blur(5px); }
                .modal-backdrop-custom.flash-correct { animation: flash-correct 0.3s ease-out; }
                .modal-backdrop-custom.flash-incorrect { animation: flash-incorrect 0.3s ease-out; }
                .modal-dialog-custom { z-index: 1050; }
                .modal-content { background: var(--card-bg); border: 1px solid var(--primary-glow); animation: border-glow 3s infinite; }
                .text-glow { color: var(--primary-glow); text-shadow: 0 0 8px var(--primary-glow); }
                .text-glow-secondary { color: var(--secondary-glow); text-shadow: 0 0 8px var(--secondary-glow); }
                .list-group-item { background: transparent; border-color: var(--border-color); padding: 0.75rem 0; }
                .table-row-incorrect { background-color: rgba(255, 42, 109, 0.2) !important; border-left: 3px solid var(--danger-glow); }
                .bar-chart { list-style: none; padding: 0; }
                .bar-chart li { display: flex; align-items: center; margin-bottom: 10px; }
                .bar-chart .bar-label { width: 120px; text-align: right; padding-right: 10px; font-size: 0.9rem; color: var(--text-bright); }
                .bar-chart .bar-container { flex-grow: 1; background: var(--border-color); border-radius: 3px; }
                .bar-chart .bar { height: 20px; background: linear-gradient(90deg, var(--primary-glow), var(--secondary-glow)); border-radius: 3px; }
                .recalibrate-banner {
                    background: var(--card-bg); border: 1px solid var(--danger-glow);
                    box-shadow: 0 0 10px var(--danger-glow); animation: flicker 2s infinite;
                    border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem;
                }
                .learning-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; max-height: 60vh; overflow-y: auto; padding: 1rem; }
                .learning-grid-item { background: var(--border-color); padding: 1rem; text-align: center; border-radius: 0.5rem; transition: all 0.2s ease-in-out; }
                .learning-grid-item:hover { background: var(--primary-glow); color: var(--bg-color); transform: scale(1.05); }
            `}</style>
            <div className={`app-container ${isModalActive ? 'modal-active' : ''}`}>
                <div className="main-content">
                    <Header />
                    <main className="container py-5">
                        {isLoading ? <LoadingSpinner /> : (
                            view === 'dashboard' ? <Dashboard onStartQuiz={handleQuizStart} onStartLearn={handleLearnStart} onStartHistory={handleHistoryStart} data={dashboardData} aiAssessment={aiAssessment} onRefreshAssessment={fetchAssessment} frequentTest={frequentTest} onFrequentTestClose={() => setFrequentTest(null)} playSound={playSound} /> :
                            view === 'review' ? <QuizReview reviewData={lastQuizReview} onFinish={handleExitSubView} playSound={playSound} /> :
                            view === 'learn' ? <LearningHub settings={learnSettings} onExit={handleExitSubView} playSound={playSound} frequentTest={frequentTest} onFrequentTestClose={() => setFrequentTest(null)} /> :
                            view === 'history' ? <HistoryView onExit={handleExitSubView} playSound={playSound} /> : null
                        )}
                    </main>
                </div>
                {view === 'quiz' && <QuizView settings={quizSettings} onComplete={handleQuizComplete} playSound={playSound} triggerVisualFeedback={triggerVisualFeedback} visualFeedback={visualFeedback} />}
                {lastSessionSummary && <SessionSummaryModal summaryData={lastSessionSummary} onClose={closeLastSessionSummary} playSound={playSound} />}
                {newHighScoreInfo && <SreeleelaCongratsModal scoreInfo={newHighScoreInfo} onClose={handleExitSubView} playSound={playSound} />}
            </div>
        </>
    );
}

// --- Sub-Components ---
const Header = () => ( <header className="main-header p-3 mb-4"> <div className="container d-flex justify-content-center align-items-center"> <h1 className="h4 mb-0 fw-bold text-glow">🚀 SPEED MATH INTERFACE</h1> </div> </header> );
const LoadingSpinner = () => ( <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}> <div className="spinner-border text-glow" role="status" style={{ width: '3rem', height: '3rem' }}> <span className="visually-hidden">Loading...</span> </div> </div> );

const Dashboard = ({ onStartQuiz, onStartLearn, onStartHistory, data, aiAssessment, onRefreshAssessment, frequentTest, onFrequentTestClose, playSound }) => (
    <div>
        <GameSelection onSelectQuiz={onStartQuiz} onSelectLearn={onStartLearn} onSelectHistory={onStartHistory} playSound={playSound} />
        {frequentTest && <FrequentTest question={frequentTest} onClose={() => { playSound('click'); onFrequentTestClose(); }} />}
        <div className="row g-4 mt-5">
            <div className="col-12"><SreeleelaAnalysisCard assessment={aiAssessment} onRefresh={() => { playSound('click'); onRefreshAssessment(); }} /></div>
            <div className="col-lg-3"><PerformanceStats stats={data?.performanceStats} /></div>
            <div className="col-lg-3"><AccuracyCard attempts={data?.recentAttempts} /></div>
            <div className="col-lg-3"><StreakCard streak={data?.currentStreak} /></div>
            <div className="col-lg-3"><UsageTracker usage={data?.dailyUsage} /></div>
        </div>
    </div>
);

const GameSelection = ({ onSelectQuiz, onSelectLearn, onSelectHistory, playSound }) => {
    const [selectedGame, setSelectedGame] = useState('multiplication');
    const [quizMode, setQuizMode] = useState('mcq');
    return (
        <div className="card p-4 text-center">
            <h2 className="fw-bold mb-4 text-glow">SELECT CHALLENGE PROTOCOL</h2>
            <div className="d-flex justify-content-center flex-wrap gap-4 mb-4">
                {Object.entries(GAME_CONFIG).map(([key, { name }]) => ( <button key={key} onClick={() => { playSound('click'); setSelectedGame(key); }} className={`hex-btn ${selectedGame === key ? 'active' : ''}`}>{name}</button> ))}
            </div>
            <div className="d-flex justify-content-center flex-wrap gap-4 mb-4">
                <div className="btn-group"><button onClick={() => { playSound('click'); setQuizMode('mcq'); }} className={`hex-btn ${quizMode === 'mcq' ? 'active' : ''}`}>Choice Matrix</button><button onClick={() => { playSound('click'); setQuizMode('direct'); }} className={`hex-btn ${quizMode === 'direct' ? 'active' : ''}`}>Direct Input</button></div>
                <button onClick={() => onSelectLearn({ game: selectedGame })} className="hex-btn">Study Mode</button>
                <button onClick={onSelectHistory} className="hex-btn">History</button>
            </div>
            <button onClick={() => onSelectQuiz({ game: selectedGame, quizMode })} className="btn btn-initiate btn-lg fw-bold px-5 mt-3">INITIATE QUIZ</button>
        </div>
    );
};

const SreeleelaAnalysisCard = ({ assessment, onRefresh }) => (
    <div className="card p-4">
        <div className="row g-3 align-items-center">
            <div className="col-md-2 text-center">
                <img src={sreeleelaProfilePic} alt="Sree Leela" className="img-fluid rounded-circle" style={{border: '3px solid var(--primary-glow)', width: '100px', height: '100px'}} />
            </div>
            <div className="col-md-10">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="fw-bold mb-0 text-glow">SREE LEELA'S ANALYSIS</h4>
                    <button onClick={onRefresh} disabled={assessment.loading} className="btn btn-sm btn-outline-info">{assessment.loading ? 'ANALYZING...' : 'RE-ASSESS'}</button>
                </div>
                <p className="mb-0 fst-italic" style={{color: 'var(--text-bright)'}}>{assessment.text}</p>
            </div>
        </div>
    </div>
);

const PerformanceStats = ({ stats }) => (
    <div className="card h-100 p-4">
        <h4 className="fw-bold mb-3 text-glow">🏆 PERSONAL BESTS</h4>
        {stats && Object.keys(stats).length > 0 ? (
            <ul className="list-group list-group-flush">
                {Object.entries(stats).map(([game, data]) => (
                    <li key={game} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold" style={{color: 'var(--text-bright)'}}>{GAME_CONFIG[game]?.name || game}</span>
                            <span className="badge bg-info fs-6">{formatTime(data.timeTaken)}</span>
                        </div>
                        <div className="text-start">
                            <span className="badge bg-success fs-6">{data.score} / {data.totalQuestions} Points</span>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p style={{color: 'var(--text-bright)'}}>No data records. Complete a protocol.</p>
        )}
    </div>
);

const AccuracyCard = ({ attempts }) => {
    const { totalScore, totalQuestions } = useMemo(() => {
        if (!attempts || attempts.length === 0) return { totalScore: 0, totalQuestions: 0 };
        return attempts.reduce((acc, attempt) => {
            acc.totalScore += attempt.score;
            acc.totalQuestions += attempt.totalQuestions;
            return acc;
        }, { totalScore: 0, totalQuestions: 0 });
    }, [attempts]);

    const accuracy = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
    const strokeDashoffset = 283 * (1 - accuracy / 100);

    return (
        <div className="card h-100 p-4 text-center">
            <h4 className="fw-bold mb-3 text-glow">🎯 OVERALL ACCURACY</h4>
            <div className="d-flex justify-content-center align-items-center" style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
                <svg width="120" height="120" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--border-color)" strokeWidth="10" />
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--success-glow)" strokeWidth="10" strokeDasharray="283" strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 50 50)" />
                </svg>
                <span className="position-absolute top-50 start-50 translate-middle fs-3 fw-bold text-glow">{accuracy.toFixed(1)}%</span>
            </div>
            <p className="mt-3" style={{color: 'var(--text-bright)'}}>{totalScore} correct out of {totalQuestions} total questions.</p>
        </div>
    );
};

const StreakCard = ({ streak }) => (
    <div className="card h-100 p-4 text-center">
        <h4 className="fw-bold mb-3 text-glow">🔥 DAILY STREAK</h4>
        <div className="d-flex justify-content-center align-items-center" style={{fontSize: '4rem', textShadow: '0 0 20px var(--warning-glow)'}}>
            {streak || 0}
        </div>
        <p className="mt-3" style={{color: 'var(--text-bright)'}}>{streak > 0 ? `You're on a roll!` : `Start your streak today!`}</p>
    </div>
);

const UsageTracker = ({ usage }) => {
    const maxTime = useMemo(() => { if (!usage || usage.length === 0) return 1; return Math.max(...usage.map(day => day.timeSpent)); }, [usage]);
    return ( <div className="card h-100 p-4"> <h4 className="fw-bold mb-3 text-glow">📊 DAILY ACTIVITY LOG</h4> {usage && usage.length > 0 ? <ul className="bar-chart"> {usage.map(day => ( <li key={day.date}> <span className="bar-label">{new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span> <div className="bar-container"> <div className="bar" style={{ width: `${(day.timeSpent / maxTime) * 100}%` }}></div> </div> <span className="ms-3 fw-bold" style={{color: 'var(--text-bright)', textShadow: '0 0 3px #000'}}>{formatTime(day.timeSpent, false)}</span> </li> ))} </ul> : <p style={{color: 'var(--text-bright)'}}>No activity logged.</p>} </div> );
};

const FrequentTest = ({ question, onClose }) => ( <div className="recalibrate-banner"> <div className="d-flex justify-content-between align-items-center"> <div className="fw-bold"> <span className="text-glow-secondary me-2">⚡ RECALIBRATE ⚡</span> <span style={{color: 'var(--text-bright)'}}>Error detected: {question.question} | Correct: <span className="text-success">{question.correctAnswer}</span></span> </div> <button className="btn-close btn-close-white" onClick={onClose}></button> </div> </div> );

const QuizView = ({ settings, onComplete, playSound, triggerVisualFeedback, visualFeedback }) => {
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [quizTime, setQuizTime] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [reviewData, setReviewData] = useState([]);

    useEffect(() => {
        setQuestions(generateQuestions(settings.game));
        setStartTime(new Date());
        const timer = setInterval(() => setQuizTime(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [settings.game]);

    const currentQuestion = useMemo(() => questions[current], [questions, current]);
    const options = useMemo(() => { if (!currentQuestion || settings.quizMode !== 'mcq') return []; const { a } = currentQuestion; const incorrectOptions = new Set(); while (incorrectOptions.size < 3) { const offset = Math.floor(Math.random() * 20) + 1; const incorrect = Math.random() > 0.5 ? a + offset : a - offset; if (incorrect !== a && incorrect > 0) { incorrectOptions.add(incorrect); } } return [...incorrectOptions, a].sort(() => Math.random() - 0.5); }, [currentQuestion, settings.quizMode]);

    const handleNext = useCallback((answer) => {
        if (!answer) return;
        const isCorrect = parseInt(answer) === currentQuestion.a;
        if (isCorrect) { playSound('correct'); triggerVisualFeedback('correct'); } else { playSound('incorrect'); triggerVisualFeedback('incorrect'); }
        const newReviewEntry = { question: currentQuestion.q, userAnswer: answer, correctAnswer: currentQuestion.a, isCorrect };
        setReviewData(prev => [...prev, newReviewEntry]);
        if (isCorrect) { setScore(prev => prev + 1); }
        if (current < questions.length - 1) {
            setCurrent(prev => prev + 1); setUserAnswer('');
        } else {
            const endTime = new Date();
            const finalWrongAnswers = [...reviewData, newReviewEntry].filter(r => !r.isCorrect).map(r => ({ question: r.question, incorrectAnswer: r.userAnswer, correctAnswer: r.correctAnswer }));
            onComplete({ tableId: settings.game, score: isCorrect ? score + 1 : score, totalQuestions: questions.length, timeTaken: (endTime - startTime) / 1000, wrongAnswers: finalWrongAnswers, quizStartTime: startTime, quizEndTime: endTime, reviewData: [...reviewData, newReviewEntry] });
        }
    }, [current, questions, score, reviewData, currentQuestion, onComplete, settings.game, startTime, playSound, triggerVisualFeedback]);

    const handleSubmit = (e) => { e.preventDefault(); if (userAnswer.trim() === '') return; handleNext(userAnswer); };
    if (questions.length === 0) return <LoadingSpinner />;
    const progress = ((current + 1) / questions.length) * 100;

    return ( <div className={`modal-backdrop-custom ${visualFeedback ? `flash-${visualFeedback}` : ''}`}> <div className="modal-dialog modal-dialog-custom modal-dialog-centered modal-lg"> <div className="modal-content"> <div className="modal-header border-0 d-flex justify-content-between"> <h5 className="modal-title fw-bold text-glow">{GAME_CONFIG[settings.game].name.toUpperCase()} PROTOCOL</h5> <div className="text-glow">TIME: {formatTime(quizTime)}</div> </div> <div className="modal-body text-center px-sm-5 py-5"> <div className="progress mx-4 my-4" style={{height: '10px', background: 'var(--border-color)'}}> <div className="progress-bar" role="progressbar" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary-glow), var(--secondary-glow))', boxShadow: `0 0 10px var(--primary-glow)` }}></div> </div> <p className="text-muted">QUESTION {current + 1} / {questions.length}</p> <p className="display-1 fw-bold my-5 text-glow">{currentQuestion.q}</p> {settings.quizMode === 'mcq' ? <div className="row g-3"> {options.map(opt => ( <div key={opt} className="col-6"> <button onClick={() => handleNext(opt)} className="btn btn-outline-info btn-lg w-100 py-3 fs-3">{opt}</button> </div> ))} </div> : <form onSubmit={handleSubmit} className="d-flex justify-content-center"> <input type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="form-control form-control-lg text-center fs-1" style={{width: '200px', height: '80px', background: 'transparent', color: 'var(--text-bright)', border: '1px solid var(--border-color)'}} autoFocus /> <button type="submit" className="btn btn-primary btn-lg ms-3">SUBMIT</button> </form>} </div> <div className="modal-footer border-0 justify-content-center"> <p className="fw-bold fs-4 text-glow">SCORE: <span className="text-success">{score}</span></p> </div> </div> </div> </div> );
};

const QuizReview = ({ reviewData, onFinish, playSound }) => {
    const score = reviewData.filter(r => r.isCorrect).length;
    const total = reviewData.length;
    return (
        <div className="card p-4">
            <h2 className="text-glow text-center">Quiz Debriefing</h2>
            <h3 className="text-center">Final Score: <span className={score / total >= 0.7 ? 'text-success' : 'text-danger'}>{score} / {total}</span></h3>
            <div className="table-responsive mt-4" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                <table className="table table-dark table-striped">
                    <thead> <tr> <th className="text-glow">Question</th> <th className="text-glow">Your Answer</th> <th className="text-glow">Correct Answer</th> </tr> </thead>
                    <tbody> {reviewData.map((r, i) => ( <tr key={i} className={r.isCorrect ? '' : 'table-row-incorrect'}> <td>{r.question}</td> <td>{r.userAnswer}</td> <td className="text-success fw-bold">{r.correctAnswer}</td> </tr> ))} </tbody>
                </table>
            </div>
            <button onClick={() => { playSound('click'); onFinish(); }} className="btn btn-lg btn-primary mt-4 align-self-center">Return to Dashboard</button>
        </div>
    );
};

const LearningHub = ({ settings, onExit, playSound, frequentTest, onFrequentTestClose }) => {
    const tableData = useMemo(() => {
        const data = [];
        switch (settings.game) {
            case 'multiplication':
                for (let i = 1; i <= 20; i++) { for (let j = 1; j <= 20; j++) { data.push(`${i} × ${j} = ${i * j}`); } } break;
            case 'squares':
                for (let i = 1; i <= 30; i++) { data.push(`${i}² = ${i * i}`); } break;
            case 'cubes':
                for (let i = 1; i <= 15; i++) { data.push(`${i}³ = ${i * i * i}`); } break;
            default: data.push("Study mode not available for this selection.");
        }
        return data;
    }, [settings.game]);

    return (
        <div className="card p-4">
            {frequentTest && <FrequentTest question={frequentTest} onClose={() => { playSound('click'); onFrequentTestClose(); }} />}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="text-glow">Learning Hub: {GAME_CONFIG[settings.game].name}</h2>
                <button onClick={() => { playSound('click'); onExit(); }} className="btn btn-outline-info">Back to Dashboard</button>
            </div>
            <div className="learning-grid">
                {tableData.map((item, index) => (
                    <div key={index} className="learning-grid-item">{item}</div>
                ))}
            </div>
        </div>
    );
};

const HistoryView = ({ onExit, playSound }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_URL}/history`)
            .then(res => setHistory(res.data))
            .catch(err => console.error("Failed to fetch history:", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="text-glow">Full Quiz History</h2>
                <button onClick={() => { playSound('click'); onExit(); }} className="btn btn-outline-info">Back to Dashboard</button>
            </div>
            {loading ? <LoadingSpinner /> : (
                <div className="table-responsive" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                    <table className="table table-dark table-striped">
                        <thead>
                            <tr>
                                <th className="text-glow">Date</th>
                                <th className="text-glow">Game</th>
                                <th className="text-glow">Score</th>
                                <th className="text-glow">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(attempt => (
                                <tr key={attempt._id}>
                                    <td>{new Date(attempt.createdAt).toLocaleString()}</td>
                                    <td>{GAME_CONFIG[attempt.tableId]?.name || attempt.tableId}</td>
                                    <td>{attempt.score} / {attempt.totalQuestions}</td>
                                    <td>{formatTime(attempt.timeTaken)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const SessionSummaryModal = ({ summaryData, onClose, playSound }) => (
    <div className="modal-backdrop-custom">
        <div className="modal-dialog modal-dialog-custom modal-dialog-centered modal-lg">
            <div className="modal-content">
                <div className="modal-header border-0">
                    <h5 className="modal-title fw-bold text-glow">PREVIOUS SESSION REVIEW</h5>
                </div>
                <div className="modal-body">
                    <p style={{color: 'var(--text-bright)'}}>Here are the questions you answered incorrectly in your last session. Review them to improve!</p>
                     <div className="table-responsive mt-4" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                        <table className="table table-dark table-striped">
                            <thead> <tr> <th className="text-glow">Question</th> <th className="text-glow">Your Answer</th> <th className="text-glow">Correct Answer</th> </tr> </thead>
                            <tbody> {summaryData.map((r, i) => ( <tr key={i} className="table-row-incorrect"> <td>{r.question}</td> <td>{r.incorrectAnswer}</td> <td className="text-success fw-bold">{r.correctAnswer}</td> </tr> ))} </tbody>
                        </table>
                    </div>
                </div>
                <div className="modal-footer border-0">
                    <button type="button" className="btn btn-primary" onClick={() => {playSound('click'); onClose();}}>Start New Session</button>
                </div>
            </div>
        </div>
    </div>
);

const SreeleelaCongratsModal = ({ scoreInfo, onClose, playSound }) => (
    <div className="modal-backdrop-custom">
        <div className="modal-dialog modal-dialog-custom modal-dialog-centered modal-lg">
            <div className="modal-content" style={{borderColor: 'var(--success-glow)'}}>
                <div className="modal-header border-0">
                    <h5 className="modal-title fw-bold text-success">NEW PERSONAL BEST!</h5>
                </div>
                <div className="modal-body">
                    <div className="row align-items-center">
                        <div className="col-md-4 text-center">
                            <img 
                                src={sreeleelaProfilePic}
                                alt="Sree Leela" 
                                className="img-fluid rounded-circle"
                                style={{border: '3px solid var(--success-glow)', width: '150px', height: '150px'}}
                            />
                            <h4 className="mt-3 text-glow">Sree Leela</h4>
                        </div>
                        <div className="col-md-8">
                            <div className="p-3 rounded" style={{background: 'rgba(0,0,0,0.2)'}}>
                                <p className="fs-4 fst-italic">"Hey, that was amazing! I was monitoring your performance, and you just set a new record."</p>
                                <p className="fs-5">"A score of <strong className="text-success">{scoreInfo.score}/{scoreInfo.total}</strong> in the {scoreInfo.gameName} protocol, completed in just <strong className="text-info">{formatTime(scoreInfo.time)}</strong>. That's incredibly impressive."</p>
                                <p className="fs-5 fst-italic">"Your dedication is really paying off. Keep up this phenomenal work!"</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer border-0">
                    <button type="button" className="btn btn-success" onClick={() => {playSound('click'); onClose();}}>Thanks, Sree!</button>
                </div>
            </div>
        </div>
    </div>
);


export default App;
