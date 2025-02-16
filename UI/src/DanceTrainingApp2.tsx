import React, { useState, useEffect } from 'react';
import { Camera, Play, Pause, Share2, Award, Search } from 'lucide-react';

const DanceTrainingApp2 = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedDance, setSelectedDance] = useState(null);
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [serverStatus, setServerStatus] = useState('checking');

  const dances = [
    { id: 1, name: 'The Griddy', difficulty: 'Medium', duration: '30 seconds', style: 'Hip Hop' },
    { id: 2, name: 'Macarena', difficulty: 'Easy', duration: '45 seconds', style: 'Party' },
    { id: 3, name: 'Robot Dance', difficulty: 'Hard', duration: '20 seconds', style: 'Freestyle' },
    { id: 4, name: 'Moonwalk', difficulty: 'Hard', duration: '25 seconds', style: 'Pop' },
    { id: 5, name: 'Floss Dance', difficulty: 'Medium', duration: '15 seconds', style: 'Gaming' },
    { id: 6, name: 'Shuffle', difficulty: 'Medium', duration: '40 seconds', style: 'EDM' }
  ];

  const difficulties = ['Easy', 'Medium', 'Hard'];

  const filteredDances = dances.filter(dance => {
    const matchesSearch = dance.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dance.style.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || dance.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  useEffect(() => {
    // Check server health on component mount
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        setServerStatus('connected');
        setError(null);
      } else {
        setServerStatus('error');
        setError('Server is not responding properly');
      }
    } catch (err) {
      setServerStatus('error');
      setError('Cannot connect to server. Please ensure the Python backend is running.');
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const response = await fetch(`http://localhost:5000/start_dance/${selectedDance.id}`, {
          method: 'POST'
        });
        if (response.ok) {
          setIsRecording(true);
          setScore(null);
          setError(null);
        } else {
          throw new Error('Failed to start recording');
        }
      } catch (err) {
        setError('Failed to start recording. Please check server connection.');
      }
    } else {
      try {
        const response = await fetch('http://localhost:5000/stop_dance', {
          method: 'POST'
        });
        if (response.ok) {
          const data = await response.json();
          setScore(data.score);
          setIsRecording(false);
        } else {
          throw new Error('Failed to stop recording');
        }
      } catch (err) {
        setError('Failed to stop recording. Please check server connection.');
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Dance Training App</h1>
        
        {/* Server Status */}
        {serverStatus === 'error' && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p>{error}</p>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="mb-6">
          {/* ... (search and filter code remains the same) ... */}
        </div>

        {/* Dance Selection */}
        <div className="mb-8">
          {/* ... (dance selection code remains the same) ... */}
        </div>

        {/* Camera Feed */}
        <div className="mb-8">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow">
            {serverStatus === 'connected' ? (
              <img 
                src="http://localhost:5000/video_feed" 
                className="w-full h-full object-cover"
                alt="Camera feed"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <Camera className="w-16 h-16 text-white opacity-50" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={toggleRecording}
            disabled={!selectedDance || serverStatus !== 'connected'}
            className={`px-6 py-3 rounded-full flex items-center gap-2 shadow transition-all duration-200 ${
              !selectedDance || serverStatus !== 'connected'
                ? 'bg-gray-300 cursor-not-allowed opacity-50'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isRecording ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Dancing</span>
              </>
            )}
          </button>
        </div>

        {/* Score Display */}
        {score !== null && (
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Award className="w-8 h-8 text-yellow-500" />
              <h2 className="text-3xl font-bold">Your Score: {score}</h2>
            </div>
            <p className="text-gray-600 mb-4">
              {score >= 90
                ? "Amazing! You're a natural!"
                : score >= 80
                ? "Great job! Keep practicing!"
                : score >= 70
                ? "Good effort! You're getting there!"
                : "Nice try! Practice makes perfect!"}
            </p>
            <button 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Result</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DanceTrainingApp2;