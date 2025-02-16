import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/button';
import VideoPoseProcessor from './VideoPoseProcessor';
import PoseComparison from './PoseComparison';

const DanceTrainingSystem = () => {
  const [poses, setPoses] = useState([]);
  const [currentMode, setCurrentMode] = useState('extract'); // 'extract' or 'practice'

  const handlePosesExtracted = (extractedPoses) => {
    setPoses(extractedPoses);
    setCurrentMode('practice');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex justify-center space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            currentMode === 'extract' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setCurrentMode('extract')}
        >
          Extract Poses
        </button>
        <button
          className={`px-4 py-2 rounded ${
            currentMode === 'practice' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setCurrentMode('practice')}
          disabled={poses.length === 0}
        >
          Practice
        </button>
      </div>

      {currentMode === 'extract' ? (
        <VideoPoseProcessor onPosesExtracted={handlePosesExtracted} />
      ) : (
        <PoseComparison poses={poses} />
      )}
    </div>
  );
};

export default DanceTrainingSystem;