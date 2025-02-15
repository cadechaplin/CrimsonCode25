from mediapipe import solutions
from mediapipe.framework.formats import landmark_pb2
import numpy as np
import cv2

# Initialize MediaPipe Pose solution
mp_pose = solutions.pose
pose = mp_pose.Pose()

# Initialize MediaPipe drawing solution
mp_drawing = solutions.drawing_utils

# Open the camera
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

# Flag to track window state
window_closed = False

while cap.isOpened() and not window_closed:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    # Convert the BGR image to RGB
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process the image and find the pose landmarks
    results = pose.process(image)

    # Draw the pose landmarks on the image
    if results.pose_landmarks:
        mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

    # Display the image
    cv2.imshow('MediaPipe Pose', frame)

    # Check for window closing event or ESC key
    key = cv2.waitKey(5) & 0xFF
    if key == 27 or cv2.getWindowProperty('MediaPipe Pose', cv2.WND_PROP_VISIBLE) < 1:
        window_closed = True
        break

# Clean up
cap.release()
cv2.destroyAllWindows()