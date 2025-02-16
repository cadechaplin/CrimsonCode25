from flask import Flask, Response, jsonify
from flask_cors import CORS
from mediapipe import solutions
import cv2
import numpy as np
import platform
import json
from threading import Thread
import base64

app = Flask(__name__)
CORS(app)

class PoseDetector:
    def __init__(self):
        self.mp_pose = solutions.pose
        self.pose = self.mp_pose.Pose()
        self.mp_drawing = solutions.drawing_utils
        self.cap = None
        self.is_capturing = False
        self.current_dance = None
        self.scores = []
        
    def initialize_camera(self):
        if platform.system() == 'Windows':
            self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        else:
            self.cap = cv2.VideoCapture(0)
            
    def calculate_dance_score(self, landmarks):
        # This is a simplified scoring mechanism
        # In a real app, you'd compare against reference poses for the specific dance
        if landmarks and self.current_dance:
            # Example: Calculate smoothness of movement
            score = np.random.randint(60, 100)  # Placeholder scoring
            self.scores.append(score)
            return score
        return 0

    def get_frame(self):
        if not self.is_capturing:
            return None
            
        if self.cap is None or not self.cap.isOpened():
            self.initialize_camera()
            
        ret, frame = self.cap.read()
        if not ret:
            return None
            
        # Convert the BGR image to RGB
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the image and find pose landmarks
        results = self.pose.process(image)
        
        # Draw landmarks on frame
        if results.pose_landmarks:
            self.mp_drawing.draw_landmarks(
                frame, results.pose_landmarks, self.mp_pose.POSE_CONNECTIONS)
            
            if self.is_capturing:
                score = self.calculate_dance_score(results.pose_landmarks)
                
        # Convert frame to JPEG
        ret, jpeg = cv2.imencode('.jpg', frame)
        return jpeg.tobytes()

    def release_camera(self):
        if self.cap is not None:
            self.cap.release()
            self.cap = None

detector = PoseDetector()

def generate_frames():
    while True:
        frame = detector.get_frame()
        if frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stop_dance', methods=['POST'])
def stop_dance():
    detector.is_capturing = False
    detector.release_camera()  # Add this line to release the camera
    final_score = int(np.mean(detector.scores)) if detector.scores else 0
    detector.scores = []
    return jsonify({
        "status": "stopped",
        "score": final_score
    })

@app.route('/start_dance/<dance_id>', methods=['POST'])
def start_dance(dance_id):
    detector.initialize_camera()  # Add this line to ensure camera is initialized
    detector.current_dance = dance_id
    detector.is_capturing = True
    detector.scores = []
    return jsonify({"status": "started"})


@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)