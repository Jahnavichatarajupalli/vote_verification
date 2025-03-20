// Import face-api from local file
import { speak, VoiceMessages } from './speechUtils';
import { toast } from 'react-toastify';
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
            faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
            faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        console.log('Face-api models loaded successfully');
    } catch (error) {
        console.error('Error loading face-api models:', error);
        throw error;
    }
};

// Add liveness detection function
// Update detectLiveness function to be more accurate
export const detectLiveness = async (videoElement) => {
    const faceapi = getFaceApi();
    const detections = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

    if (!detections) return false;

    // Strict blink detection using multiple expression indicators
    const expressions = detections.expressions;
    const isBlinking = expressions.surprised > 0.5 && expressions.neutral < 0.3;
    console.log('Blink Detection Values:', {
        surprised: expressions.surprised,
        neutral: expressions.neutral,
        isBlinking: isBlinking
    });
    return isBlinking;
};

export const verifyFace = async (videoElement) => {
    try {
        const faceapi = getFaceApi();
        
        const detection = await faceapi
            .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            VoiceMessages.noFaceDetected();
            throw new Error('No face detected in camera feed');
        }

        console.log('Face detected, matching with stored face...');
        const match = faceMatcher.findBestMatch(detection.descriptor);
        console.log('Match result:', match.toString());
        
        const isMatch = match.label === 'voter' && match.distance < 0.45;
        
        if (!isMatch) {
            // Clear error message for face mismatch
            console.log('Face does not match with voter record');
            toast.error('Face does not match with voter record. Verification failed')
            VoiceMessages.error("Face does not match with voter record. Verification failed.");
            
            return false;
        }

        // Rest of the verification process...
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Face matched, requesting blink verification");
        toast.success('Face matched! Please blink once to complete verification')
        await VoiceMessages.success("Face matched! Please blink once to complete verification");
        
        return await checkForBlink(videoElement);

    } catch (error) {
        console.error('Error in face verification:', error);
        toast.error('An error occurred during face verification')
        VoiceMessages.systemError('An error occurred during face verification');
        throw error;
    }
};

// Separate function for blink detection
const checkForBlink = async (videoElement) => {
    const faceapi = getFaceApi();  // Add this line to get faceapi reference
    let blinkDetected = false;
    let attempts = 0;
    const maxAttempts = 150;

    while (!blinkDetected && attempts < maxAttempts) {
        const detections = await faceapi
            .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections) {
            const expressions = detections.expressions;
            blinkDetected = expressions.surprised > 0.5 && expressions.neutral < 0.3;
            
            if (!blinkDetected && attempts % 30 === 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
                toast.error('Please blink to complete verification')
                await VoiceMessages.error("Please blink to complete verification");
            }
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!blinkDetected) {
        toast.error('No blink detected. Verification failed.')
        VoiceMessages.error("No blink detected. Verification failed.");
        return false;
    }

    VoiceMessages.verificationSuccess();
    return true;
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


