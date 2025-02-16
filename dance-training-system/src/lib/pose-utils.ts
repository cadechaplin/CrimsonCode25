// src/lib/pose-utils.ts
import { PoseLandmark } from '@mediapipe/pose';

export interface SavedPoseSequence {
  name: string;
  poses: PoseLandmark[][];
  timing: number[];
  metadata: {
    created: string;
    videoSource?: string;
    fps?: number;
  };
}

export function interpolatePoses(
  pose1: PoseLandmark[],
  pose2: PoseLandmark[],
  t: number
): PoseLandmark[] {
  return pose1.map((landmark1, i) => {
    const landmark2 = pose2[i];
    return {
      x: landmark1.x + (landmark2.x - landmark1.x) * t,
      y: landmark1.y + (landmark2.y - landmark1.y) * t,
      z: landmark1.z + (landmark2.z - landmark1.z) * t,
      visibility: landmark1.visibility + (landmark2.visibility - landmark1.visibility) * t,
    };
  });
}

export function calculatePoseSimilarity(
  currentPose: PoseLandmark[],
  targetPose: PoseLandmark[],
  weights?: { [key: number]: number }
): number {
  let totalDistance = 0;
  let totalWeight = 0;

  currentPose.forEach((landmark, i) => {
    const weight = weights?.[i] || 1;
    const target = targetPose[i];
    
    // Skip if either landmark has low visibility
    if (landmark.visibility < 0.5 || target.visibility < 0.5) {
      return;
    }

    const dx = (landmark.x - target.x) * weight;
    const dy = (landmark.y - target.y) * weight;
    const dz = (landmark.z - target.z) * weight;
    
    totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
    totalWeight += weight;
  });

  // Normalize by total weight and convert to percentage
  const similarity = Math.max(0, 100 - (totalDistance / totalWeight) * 100);
  return Math.min(similarity, 100);
}

export function savePoseSequence(sequence: SavedPoseSequence): void {
  const blob = new Blob([JSON.stringify(sequence)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sequence.name.replace(/\s+/g, '_')}_poses.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function loadPoseSequence(file: File): Promise<SavedPoseSequence> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const sequence = JSON.parse(e.target?.result as string);
        resolve(sequence);
      } catch (error) {
        reject(new Error('Invalid pose sequence file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}

// Weighted landmarks for more accurate similarity calculation
export const POSE_WEIGHTS = {
  // Torso
  11: 1.5, // left shoulder
  12: 1.5, // right shoulder
  23: 1.5, // left hip
  24: 1.5, // right hip
  
  // Arms
  13: 1.2, // left elbow
  14: 1.2, // right elbow
  15: 1.0, // left wrist
  16: 1.0, // right wrist
  
  // Legs
  25: 1.2, // left knee
  26: 1.2, // right knee
  27: 1.0, // left ankle
  28: 1.0, // right ankle
};

export function extractPoseTimestamps(
  poses: PoseLandmark[][],
  fps: number
): number[] {
  return poses.map((_, index) => index * (1000 / fps));
}

// src/lib/pose-utils.ts
export const savePosesToFile = (poses, sequenceName) => {
  const data = {
    name: sequenceName || 'dance_sequence',
    poses: poses,
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sequenceName || 'dance_sequence'}_poses.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const loadPosesFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data.poses);
      } catch (error) {
        reject(new Error('Invalid pose file format'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};