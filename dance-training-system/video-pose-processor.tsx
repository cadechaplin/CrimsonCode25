import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/button';
import { Upload } from 'lucide-react';

const VideoPoseProcessor = () => {
  const [processingStatus, setProcessingStatus] = useState('');
  const [videoFiles, setVideoFiles] = useState([]);
  const [extractedPoses, setExtractedPoses] = useState([]);
  const videoRef = useRef(null);
  const processingVideoRef = useRef(null);
  
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

  const processVideo = async (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      
      const poses = [];
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
              ctx.drawImage(video, 0, 0);
              
              // Extract pose from current frame
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
            resolve(poses);
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

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    setVideoFiles(files);
    setProcessingStatus('Starting video processing...');
    
    const allPoses = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatus(`Processing video ${i + 1} of ${files.length}: ${file.name}`);
      
      try {
        const poses = await processVideo(file);
        allPoses.push(...poses);
        setProcessingStatus(`Completed processing ${file.name}. Extracted ${poses.length} poses.`);
      } catch (error) {
        setProcessingStatus(`Error processing ${file.name}: ${error.message}`);
      }
    }
    
    setExtractedPoses(allPoses);
    setProcessingStatus(`Completed processing all videos. Total poses extracted: ${allPoses.length}`);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
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
          
          {extractedPoses.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">
                Extracted {extractedPoses.length} poses
              </h3>
              <p className="text-sm text-gray-600">
                Poses are ready to be used in the comparison system
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPoseProcessor;