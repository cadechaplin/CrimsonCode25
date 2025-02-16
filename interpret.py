import cv2
import csv
from mediapipe import solutions
import numpy as np

def save_pose_landmarks(video_path, output_csv):
    # Initialize MediaPipe Pose solution
    mp_pose = solutions.pose
    pose = mp_pose.Pose()

    # Open the video file
    cap = cv2.VideoCapture(video_path)

    # Get the frame rate of the video
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = 0

    # Open a CSV file to save the positions
    with open(output_csv, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Frame', 'Landmark', 'X', 'Y', 'Z', 'Visibility'])

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Convert the BGR image to RGB
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Process the image and find the pose landmarks
            results = pose.process(image)

            # Save the pose landmarks every tenth of a second
            if frame_count % int(fps / 10) == 0 and results.pose_landmarks:
                for idx, landmark in enumerate(results.pose_landmarks.landmark):
                    writer.writerow([frame_count, idx, landmark.x, landmark.y, landmark.z, landmark.visibility])

            frame_count += 1

    cap.release()

def compare_poses(video_path, csv_path):
    # Initialize MediaPipe Pose solution
    mp_pose = solutions.pose
    pose = mp_pose.Pose()

    # Open the video file
    cap = cv2.VideoCapture(video_path)

    # Get the frame rate of the video
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = 0

    # Read the CSV file with saved poses
    saved_poses = {}
    with open(csv_path, mode='r') as file:
        reader = csv.reader(file)
        next(reader)  # Skip header
        for row in reader:
            frame, landmark, x, y, z, visibility = row
            frame = int(frame)
            landmark = int(landmark)
            if frame not in saved_poses:
                saved_poses[frame] = []
            saved_poses[frame].append((landmark, float(x), float(y), float(z), float(visibility)))

    total_distance = 0
    count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Convert the BGR image to RGB
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process the image and find the pose landmarks
        results = pose.process(image)

        # Compare the pose landmarks every tenth of a second
        if frame_count % int(fps / 10) == 0 and results.pose_landmarks:
            current_poses = [(idx, landmark.x, landmark.y, landmark.z, landmark.visibility) for idx, landmark in enumerate(results.pose_landmarks.landmark)]
            saved_pose = saved_poses.get(frame_count, [])
            if saved_pose:
                for current, saved in zip(current_poses, saved_pose):
                    _, cx, cy, cz, _ = current
                    _, sx, sy, sz, _ = saved
                    distance = np.sqrt((cx - sx) ** 2 + (cy - sy) ** 2 + (cz - sz) ** 2)
                    total_distance += distance
                    count += 1

        frame_count += 1

    cap.release()

    # Calculate the average distance
    average_distance = total_distance / count if count > 0 else float('inf')
    return average_distance

# Example usage
save_pose_landmarks('testvideos/dance1.mp4', 'pose_landmarks.csv')
score1 = compare_poses('testvideos/dance1.mp4', 'pose_landmarks.csv')
score2 = compare_poses('testvideos/dance2.mp4', 'pose_landmarks.csv')
score3 = compare_poses('testvideos/dance3.mp4', 'pose_landmarks.csv')
save_pose_landmarks('testvideos/dance3.mp4', 'pose_landmarks.csv')
score4 = compare_poses('testvideos/dance3.mp4', 'pose_landmarks.csv')


print(f"Score for dance1.mp4: {score1}")
print(f"Score for dance2.mp4: {score2}")
print(f"Score for dance3.mp4: {score3}")
print(f"Score for dance3.mp4 after saving new pose landmarks: {score4}")
