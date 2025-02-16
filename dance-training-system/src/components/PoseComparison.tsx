// src/components/PoseComparison.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle, RotateCcw, FastForward } from 'lucide-react';
import { 
  SavedPoseSequence,
  calculatePoseSimilarity,
  interpolatePoses,
  POSE_WEIGHTS 
} from '@/lib/pose-utils';

interface PoseComparisonProps {
  sequence: SavedPoseSequence;
  onComplete?: () => void;
}

const PoseComparison: React.FC<PoseComparisonProps> = ({ sequence, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [similarity, setSimilarity] = useState(0);
  const [interpolatedPose, setInterpolatedPose] = useState(sequence.poses[0]);
  const [lastFrameTime, setLastFrameTime] = useState(0);

  useEffect(() => {
    let pose;
    let animationFrame: number;
    let lastTimestamp = 0;
    
    const initializePose = async () => {
      const { Pose } = await import('@mediapipe/pose');
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
        minTrackingConfidence: 0.5
      });

      pose.onResults((results) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas and draw video frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
          // Draw current pose in green
          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 2
          });
          drawLandmarks(ctx, results.poseLandmarks, {
            color: '#FF0000',
            lineWidth: 1
          });

          // Draw target pose in blue
          drawConnectors(ctx, interpolatedPose, POSE_CONNECTIONS, {
            color: 'rgba(0, 0, 255, 0.5)',
            lineWidth: 2
          });
          drawLandmarks(ctx, interpolatedPose, {
            color: 'rgba(0, 255, 255, 0.5)',
            lineWidth: 1
          });

          // Calculate and update similarity
          const newSimilarity = calculatePoseSimilarity(
            results.poseLandmarks,
            interpolatedPose,
            POSE_WEIGHTS
          );
          setSimilarity(newSimilarity);
        }
      });

      const camera = new Camera(videoRef.current!, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480
      });

      await camera.start();
    };

    const updatePose = (timestamp: number) => {
      if (!isPlaying) return;

      const deltaTime = timestamp - lastTimestamp;
      const currentTime = lastFrameTime + deltaTime;

      // Find the correct pose indices for interpolation
      const currentTiming = sequence.timing[currentPoseIndex];
      const nextTiming = sequence.timing[currentPoseIndex + 1];

      if (currentTime >= nextTiming && currentPoseIndex < sequence.poses.length - 1) {
        setCurrentPoseIndex(prev => prev + 1);
        setLastFrameTime(currentTime);
      } else if (currentTime >= sequence.timing[sequence.poses.length - 1]) {
        setIsPlaying(false);
        if (onComplete) onComplete();
        return;
      }

      // Interpolate between current and next pose
      const t = (currentTime - currentTiming) / (nextTiming - currentTiming);
      const interpolated = interpolatePoses(
        sequence.poses[currentPoseIndex],
        sequence.poses[currentPoseIndex + 1] || sequence.poses[currentPoseIndex],
        Math.min(1, t)
      );
      setInterpolatedPose(interpolated);

      lastTimestamp = timestamp;
      animationFrame = requestAnimationFrame(updatePose);
    };

    initializePose();

    if (isPlaying) {
      lastTimestamp = performance.now();
      animationFrame = requestAnimationFrame(updatePose);
    }

    return () => {
      if (pose) pose.close();
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [sequence, currentPoseIndex, isPlaying, lastFrameTime, interpolatedPose]);

  const handlePlayPause = () => {
    if (!isPlaying) {
      setLastFrameTime(sequence.timing[currentPoseIndex]);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentPoseIndex(0);
    setLastFrameTime(0);
    setIsPlaying(false);
    setInterpolatedPose(sequence.poses[0]);
  };

  const handleSkipForward = () => {
    if (currentPoseIndex < sequence.poses.length - 1) {
      setCurrentPoseIndex(prev => prev + 1);
      setLastFrameTime(sequence.timing[currentPoseIndex + 1]);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Practice Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-[480px] hidden"
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="w-full h-[480px]"
              width={640}
              height={480}
            />
            <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded">
              Similarity: {similarity.toFixed(1)}%
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handlePlayPause}>
              {isPlaying ? (
                <PauseCircle className="w-4 h-4 mr-2" />
              ) : (
                <PlayCircle className="w-4 h-4 mr-2" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={handleSkipForward}>
              <FastForward className="w-4 h-4 mr-2" />
              Skip
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Pose {currentPoseIndex + 1} of {sequence.poses.length}
            </p>
            <p className="text-xs text-gray-500">
              Time: {(lastFrameTime / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PoseComparison;