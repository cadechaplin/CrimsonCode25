// src/components/VideoPoseProcessor.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VideoPoseProcessor = ({ onPosesExtracted }) => {
  const [processingStatus, setProcessingStatus] = useState('');
  const [sequenceName, setSequenceName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, frame: 0, totalFrames: 0 });
  const [detailedStatus, setDetailedStatus] = useState([]);
  const [extractedPoses, setExtractedPoses] = useState([]);
  const poseRef = useRef(null);

  const addStatus = (status) => {
    setDetailedStatus(prev => [...prev, { time: new Date().toLocaleTimeString(), message: status }]);
  };

  useEffect(() => {
    const initializePose = async () => {
      addStatus('Initializing pose detection...');
      const { Pose } = await import('@mediapipe/pose');
      poseRef.current = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      poseRef.current.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      addStatus('Pose detection initialized');
    };

    initializePose();
  }, []);

  const processVideo = async (videoFile) => {
    return new Promise((resolve, reject) => {
      if (!poseRef.current) {
        reject(new Error('Pose detection not initialized'));
        return;
      }

      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      
      const poses = [];
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const fps = 30;
        const totalFrames = Math.floor(duration * fps);
        setProgress({ percent: 0, frame: 0, totalFrames });
        addStatus(`Video loaded: ${duration.toFixed(1)} seconds, ${totalFrames} frames to process`);
        
        const frameInterval = 1000 / fps;
        let currentFrame = 0;
        
        const processFrame = async () => {
          if (currentFrame < totalFrames) {
            video.currentTime = currentFrame / fps;
            
            try {
              await new Promise(resolve => setTimeout(resolve, 10));
              
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0);

              await new Promise((resolve) => {
                poseRef.current.onResults((results) => {
                  if (results.poseLandmarks) {
                    poses.push([...results.poseLandmarks]);
                  }
                  resolve();
                });
                
                poseRef.current.send({ image: canvas });
              });
              
              currentFrame++;
              const percent = (currentFrame / totalFrames) * 100;
              setProgress({ 
                percent, 
                frame: currentFrame, 
                totalFrames 
              });

              if (currentFrame % 30 === 0) {
                addStatus(`Processed frame ${currentFrame}/${totalFrames} (${percent.toFixed(1)}%)`);
              }
              
              requestAnimationFrame(processFrame);
            } catch (error) {
              addStatus(`Error processing frame ${currentFrame}: ${error.message}`);
              reject(error);
            }
          } else {
            addStatus(`Processing complete. Extracted ${poses.length} poses`);
            URL.revokeObjectURL(video.src);
            resolve(poses);
          }
        };
        
        processFrame();
      };
      
      video.onerror = (error) => {
        addStatus(`Error loading video: ${error}`);
        URL.revokeObjectURL(video.src);
        reject(error);
      };
    });
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setDetailedStatus([]);
    addStatus(`Starting to process ${files.length} video(s)`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        addStatus(`Processing video ${i + 1}/${files.length}: ${file.name}`);
        const poses = await processVideo(file);
        setExtractedPoses(poses);
        onPosesExtracted(poses);
      }
    } catch (error) {
      addStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSequence = () => {
    if (extractedPoses.length === 0) {
      addStatus('No poses to save. Process a video first.');
      return;
    }

    const sequenceData = {
      name: sequenceName || 'unnamed_sequence',
      poses: extractedPoses,
      metadata: {
        timestamp: new Date().toISOString(),
        totalPoses: extractedPoses.length
      }
    };

    const blob = new Blob([JSON.stringify(sequenceData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sequenceData.name}_poses.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addStatus(`Saved ${extractedPoses.length} poses to ${sequenceData.name}_poses.json`);
  };

  const handleLoadSequence = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      addStatus('Loading saved sequence...');
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setExtractedPoses(data.poses);
          onPosesExtracted(data.poses);
          setSequenceName(data.name);
          addStatus(`Loaded ${data.poses.length} poses from ${file.name}`);
        } catch (error) {
          addStatus(`Error parsing file: ${error.message}`);
        }
      };

      reader.onerror = () => {
        addStatus('Error reading file');
      };

      reader.readAsText(file);
    } catch (error) {
      addStatus(`Error loading file: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Process Dance Videos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Sequence Name"
              className="flex-1 px-4 py-2 border rounded"
              value={sequenceName}
              onChange={(e) => setSequenceName(e.target.value)}
            />
            
            <Button
              onClick={handleSaveSequence}
              disabled={extractedPoses.length === 0 || isProcessing}
              className="bg-green-500 hover:bg-green-600"
            >
              Save Sequence
            </Button>

            <div className="relative">
              <Button
                variant="outline"
                className="relative"
                disabled={isProcessing}
              >
                Load Sequence
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".json"
                  onChange={handleLoadSequence}
                  disabled={isProcessing}
                />
              </Button>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <input
                type="file"
                id="video-upload"
                className="hidden"
                multiple
                accept="video/*"
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
              >
                {isProcessing ? 'Processing...' : 'Choose Files'}
              </label>
              <p className="mt-2 text-gray-600">
                MP4, WebM, or other video files
              </p>
            </div>
          </div>

          {isProcessing && progress.totalFrames > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-sm text-center text-gray-600">
                Processing frame {progress.frame} of {progress.totalFrames} 
                ({progress.percent.toFixed(1)}%)
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto bg-gray-50 rounded p-2">
            {detailedStatus.map((status, index) => (
              <div key={index} className="text-sm">
                <span className="text-gray-500">{status.time}:</span>{' '}
                <span className="text-gray-700">{status.message}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPoseProcessor;