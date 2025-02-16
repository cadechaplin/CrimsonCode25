import React, { useState, useRef, useEffect } from 'react';
import { Camera, Play, Pause, Share2, Award, Search } from 'lucide-react';

const DanceTrainingApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedDance, setSelectedDance] = useState(null);
  const [score, setScore] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

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
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
      }
      setCameraError(null);
    } catch (error) {
      setCameraError('Unable to access camera. Please check permissions.');
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startCamera();
      setIsRecording(true);
      setTimeout(() => {
        const randomScore = Math.floor(Math.random() * 41) + 60;
        setScore(randomScore);
      }, 5000);
    } else {
      stopCamera();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Dance Training App</h1>
        
        {/* Search and Filter Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search dances by name or style..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            
            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value="all">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dance Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Select a Dance</h2>
          {filteredDances.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No dances found matching your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredDances.map(dance => (
                <div
                  key={dance.id}
                  onClick={() => setSelectedDance(dance)}
                  className={`p-4 rounded-lg shadow cursor-pointer transition-all duration-200 ${
                    selectedDance?.id === dance.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white hover:bg-blue-50'
                  }`}
                >
                  <h3 className="font-semibold">{dance.name}</h3>
                  <p className="text-sm mt-1">Style: {dance.style}</p>
                  <p className="text-sm mt-1">Difficulty: {dance.difficulty}</p>
                  <p className="text-sm mt-1">Duration: {dance.duration}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Camera View */}
        <div className="mb-8">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isRecording && (
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
            disabled={!selectedDance}
            className={`px-6 py-3 rounded-full flex items-center gap-2 shadow transition-all duration-200 ${
              !selectedDance
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

        {/* Error Message */}
        {cameraError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <h4 className="font-semibold mb-1">Error</h4>
            <p>{cameraError}</p>
          </div>
        )}

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

export default DanceTrainingApp;