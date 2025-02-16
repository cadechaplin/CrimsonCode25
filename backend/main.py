from mediapipe import solutions
from mediapipe.framework.formats import landmark_pb2
import numpy as np
import cv2
import platform

# Initialize MediaPipe Pose solution
mp_pose = solutions.pose
pose = mp_pose.Pose()

# Initialize MediaPipe drawing solution
mp_drawing = solutions.drawing_utils

# Open the camera based on operating system
if platform.system() == 'Windows':
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)  # Windows-specific
else:
    cap = cv2.VideoCapture(0)  # macOS and other platforms

# Flag to track window state
window_closed = False
window_name = 'MediaPipe Pose'

# Create window with normal flags for proper controls on macOS
cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

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
    cv2.imshow(window_name, frame)

    # Check for window closing event or ESC key
    key = cv2.waitKey(5) & 0xFF
    if key == 27:  # ESC key
        window_closed = True
    elif key == ord('q'):  # Add 'q' key as another way to quit
        window_closed = True
    
    # Try to check if window exists, with error handling for macOS
    try:
        if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
            window_closed = True
    except:
        pass

# Clean up
cap.release()
cv2.destroyAllWindows()