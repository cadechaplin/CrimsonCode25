// src/components/PoseComparison.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PoseComparison = ({ poses }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [similarity, setSimilarity] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let pose;
    let camera;

    const initializePoseDetection = async () => {
      try {
        const { Pose } = await import('@mediapipe/pose');
        const { Camera } = await import('@mediapipe/camera_utils');
        const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');
        const { POSE_CONNECTIONS } = await import('@mediapipe/pose');

        pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results) => {
          if (!canvasRef.current) return;
          
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw video frame
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          
          if (results.poseLandmarks) {
            // Draw current pose landmarks
            drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
              color: '#00FF00',
              lineWidth: 2
            });
            drawLandmarks(ctx, results.poseLandmarks, {
              color: '#FF0000',
              lineWidth: 1
            });

            // Draw target pose landmarks
            if (poses[currentPoseIndex]) {
              drawConnectors(ctx, poses[currentPoseIndex], POSE_CONNECTIONS, {
                color: 'rgba(0, 0, 255, 0.5)',
                lineWidth: 2
              });
              drawLandmarks(ctx, poses[currentPoseIndex], {
                color: 'rgba(0, 255, 255, 0.5)',
                lineWidth: 1
              });

              // Calculate similarity
              const sim = calculatePoseSimilarity(results.poseLandmarks, poses[currentPoseIndex]);
              setSimilarity(sim);
            }
          }
        });

        camera = new Camera(videoRef.current, {
          onFrame: async () => {
            await pose.send({ image: videoRef.current });
          },
          width: 640,
          height: 480
        });

        await camera.start();
        setIsInitialized(true);

      } catch (error) {
        console.error('Error initializing pose detection:', error);
      }
    };

    initializePoseDetection();

    return () => {
      if (camera) camera.stop();
      if (pose) pose.close();
    };
  }, [poses, currentPoseIndex]);

  const calculatePoseSimilarity = (currentPose, targetPose) => {
    let totalDistance = 0;
    const numLandmarks = currentPose.length;
    
    for (let i = 0; i < numLandmarks; i++) {
      const dx = currentPose[i].x - targetPose[i].x;
      const dy = currentPose[i].y - targetPose[i].y;
      const dz = currentPose[i].z - targetPose[i].z;
      totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    // Convert to percentage (lower distance = higher similarity)
    const similarity = Math.max(0, 100 - (totalDistance / numLandmarks) * 100);
    return Math.min(similarity, 100);
  };

  const handlePrevPose = () => {
    setCurrentPoseIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPose = () => {
    setCurrentPoseIndex(prev => Math.min(poses.length - 1, prev + 1));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Practice Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full"
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              width={640}
              height={480}
            />
            <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded">
              Similarity: {similarity.toFixed(1)}%
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevPose}
              disabled={currentPoseIndex === 0}
            >
              Previous
            </Button>

            <div className="text-center">
              <span className="text-lg font-semibold">
                Pose {currentPoseIndex + 1} of {poses.length}
              </span>
            </div>

            <Button
              onClick={handleNextPose}
              disabled={currentPoseIndex === poses.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PoseComparison;