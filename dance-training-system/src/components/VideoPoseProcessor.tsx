// src/components/VideoPoseProcessor.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Save, FileUp } from 'lucide-react';
import { 
  SavedPoseSequence,
  savePoseSequence,
  loadPoseSequence,
  extractPoseTimestamps 
} from '@/lib/pose-utils';

interface VideoPoseProcessorProps {
  onPosesExtracted: (poses: SavedPoseSequence) => void;
}

const VideoPoseProcessor: React.FC<VideoPoseProcessorProps> = ({ onPosesExtracted }) => {
  const [processingStatus, setProcessingStatus] = useState('');
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [extractedSequence, setExtractedSequence] = useState<SavedPoseSequence | null>(null);
  const [sequenceName, setSequenceName] = useState('');
  
  useEffect(() => {
    let pose;
    
    const initializePose = async () => {
      const { Pose } = await import('@mediapipe/pose');
      pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
    };

    initializePose();
    return () => {
      if (pose) pose.close();
    };
  }, []);

  const processVideo = async (videoFile: File) => {
    return new Promise<{ poses: any[], fps: number }>((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      
      const poses: any[] = [];
      let frameCount = 0;
      
      video.onloadedmetadata = () => {
        const fps = 30;
        const interval = 1000 / fps;
        video.currentTime = 0;
        
        const processFrame = async () => {
          if (video.currentTime < video.duration) {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(video, 0, 0);
              
              const results = await pose.send({ image: canvas });
              if (results.poseLandmarks) {
                poses.push([...results.poseLandmarks]);
              }
              
              frameCount++;
              video.currentTime += interval / 1000;
            } catch (error) {
              console.error('Error processing frame:', error);
              reject(error);
            }
          } else {
            URL.revokeObjectURL(video.src);
            resolve({ poses, fps });
          }
        };
        
        const processNextFrame = () => {
          if (video.currentTime < video.duration) {
            processFrame().then(() => {
              requestAnimationFrame(processNextFrame);
            });
          }
        };
        
        processNextFrame();
      };
      
      video.onerror = (error) => {
        URL.revokeObjectURL(video.src);
        reject(error);
      };
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setVideoFiles(files);
    setProcessingStatus('Starting video processing...');
    
    const allPoses: any[] = [];
    let fps = 30;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatus(`Processing video ${i + 1} of ${files.length}: ${file.name}`);
      
      try {
        const result = await processVideo(file);
        allPoses.push(...result.poses);
        fps = result.fps;
        setProcessingStatus(`Completed processing ${file.name}. Extracted ${result.poses.length} poses.`);
      } catch (error) {
        setProcessingStatus(`Error processing ${file.name}: ${error.message}`);
      }
    }
    
    const sequence: SavedPoseSequence = {
      name: sequenceName || 'Untitled Sequence',
      poses: allPoses,
      timing: extractPoseTimestamps(allPoses, fps),
      metadata: {
        created: new Date().toISOString(),
        videoSource: files.map(f => f.name).join(', '),
        fps
      }
    };
    
    setExtractedSequence(sequence);
    setProcessingStatus(`Completed processing all videos. Total poses extracted: ${allPoses.length}`);
  };

  const handleLoadSequence = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const sequence = await loadPoseSequence(file);
      setExtractedSequence(sequence);
      setSequenceName(sequence.name);
      onPosesExtracted(sequence);
    } catch (error) {
      setProcessingStatus(`Error loading sequence: ${error.message}`);
    }
  };

  const handleSaveSequence = () => {
    if (!extractedSequence) return;
    savePoseSequence(extractedSequence);
  };

  const handleStartPractice = () => {
    if (extractedSequence) {
      onPosesExtracted(extractedSequence);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Process Dance Videos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Sequence Name"
              className="px-4 py-2 border rounded"
              value={sequenceName}
              onChange={(e) => setSequenceName(e.target.value)}
            />
            <Button onClick={handleSaveSequence} disabled={!extractedSequence}>
              <Save className="w-4 h-4 mr-2" />
              Save Sequence
            </Button>
            <div className="relative">
              <Button variant="outline">
                <FileUp className="w-4 h-4 mr-2" />
                Load Sequence
              </Button>
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".json"
                onChange={handleLoadSequence}
              />
            </div>
          </div>

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  MP4, WebM, or other video files
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                multiple
                accept="video/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>
          
          {processingStatus && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <p className="text-sm text-gray-700">{processingStatus}</p>
            </div>
          )}
          
          {extractedSequence && (
            <div className="mt-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  Extracted {extractedSequence.poses.length} poses
                </h3>
                <p className="text-sm text-gray-600">
                  Sequence is ready for practice
                </p>
              </div>
              <Button onClick={handleStartPractice}>
                Start Practice
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPoseProcessor;