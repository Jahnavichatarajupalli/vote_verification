// Import face-api from local file
import { speak, VoiceMessages } from './speechUtils';

const getFaceApi = () => {
    if (!window.faceapi) {
        console.error('face-api.js is not loaded on window object');
        throw new Error('face-api.js not loaded');
    }
    console.log('face-api.js is loaded successfully');
    return window.faceapi;
};

let faceMatcher = null;
let videoStream = null;

export const loadFaceApiModels = async () => {
    try {
        const faceapi = getFaceApi();
        console.log('Loading face-api models...');
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        console.log('Face-api models loaded successfully');
    } catch (error) {
        console.error('Error loading face-api models:', error);
        throw error;
    }
};

export const createFaceMatcher = async (voterImage) => {
    try {
        const faceapi = getFaceApi();
        console.log('Creating face matcher with voter image:', voterImage);
        const img = await faceapi.fetchImage(voterImage);
        const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            throw new Error('No face detected in the voter photo');
        }

        faceMatcher = new faceapi.FaceMatcher([
            new faceapi.LabeledFaceDescriptors('voter', [detection.descriptor])
        ], 0.5);  // Adjusted threshold from 0.6 to 0.5 for better matching

        console.log('Face matcher created successfully');
        return true;
    } catch (error) {
        console.error('Error creating face matcher:', error);
        throw error;
    }
};

export const startVideo = async (videoElement) => {
    try {
        console.log('Starting video...');
        if (!videoElement) {
            throw new Error('Video element is not available');
        }

        if (videoStream) {
            console.log('Stopping existing video stream');
            videoStream.getTracks().forEach(track => track.stop());
        }
        
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                facingMode: 'user'
            }
        });
        
        console.log('Camera access granted, setting up video stream');
        videoElement.srcObject = stream;
        videoStream = stream;
        
        return new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                console.log('Video metadata loaded');
                videoElement.play().then(() => {
                    console.log('Video playback started');
                    resolve();
                }).catch(err => {
                    console.error('Error starting video playback:', err);
                    throw err;
                });
            };
        });
    } catch (error) {
        console.error('Error starting video:', error);
        throw error;
    }
};

export const stopVideo = () => {
    if (videoStream) {
        console.log('Stopping video stream');
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
};

export const verifyFace = async (videoElement) => {
    try {
        const faceapi = getFaceApi();
        
        if (!faceMatcher) {
            const errorMsg = 'Face matcher not initialized';
            VoiceMessages.systemError(errorMsg);
            throw new Error(errorMsg);
        }

        if (!videoElement) {
            const errorMsg = 'Video element is not available';
            VoiceMessages.systemError(errorMsg);
            throw new Error(errorMsg);
        }

        console.log('Detecting face in video feed...');
        const detection = await faceapi
            .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            const errorMsg = 'No face detected in camera feed';
            VoiceMessages.noFaceDetected();
            throw new Error(errorMsg);
        }

        console.log('Face detected, matching with stored face...');
        const match = faceMatcher.findBestMatch(detection.descriptor);
        console.log('Match result:', match.toString());
        
        const isMatch = match.label === 'voter' && match.distance < 0.5;
        if (isMatch) {
            VoiceMessages.verificationSuccess();
        } else {
            VoiceMessages.verificationFailed();
        }
        
        return isMatch;
    } catch (error) {
        console.error('Error in face verification:', error);
        VoiceMessages.systemError('An error occurred during face verification');
        throw error;
    }
};
