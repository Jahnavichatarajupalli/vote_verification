// Utility functions for text-to-speech functionality

const synth = window.speechSynthesis;
let voices = [];

// Initialize voices immediately and set up change listener
voices = synth.getVoices();
synth.onvoiceschanged = () => {
    voices = synth.getVoices();
};

// Function to get the best voice
const getVoice = () => {
    const availableVoices = synth.getVoices();
    return availableVoices.find(voice => voice.lang === 'en-US') || 
           availableVoices.find(voice => voice.lang.startsWith('en')) || 
           availableVoices[0];
};

// Function to speak a message
export const speak = (message) => {
    return new Promise((resolve) => {
        if (!message) return resolve();


        // Cancel any ongoing speech
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(message);
        
        // Configure speech properties
        utterance.volume = 1;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.voice = getVoice();
        utterance.lang = 'en-US';

        // Event handlers
        utterance.onend = () => resolve();
        utterance.onerror = (event) => {
            console.error('Speech Error:', event);
            resolve();
        };

        // Force speak
        synth.speak(utterance);
    });
};


// Function to stop speaking
export const stopSpeaking = () => {
    synth.cancel();
};

// Predefined voice messages with forced speak
export const VoiceMessages = {
    epicNotFound: () => {
        synth.cancel();
        speak("EPIC NUMBER not found.");
    },
    wrongPollingStation: () => {
        synth.cancel();
        speak("Voter does not belong to this polling station.");
    },
    duplicateVote: () => {
        synth.cancel();
        speak("Voter has already cast their vote.");
    },
    invalidEpicFormat: () => speak("EPIC number is not in the required format."),
    
    // Face verification messages
    verificationSuccess: () => speak("Voter verification successful! The voter can now proceed to cast their vote."),
    verificationFailed: () => speak("Face verification failed."),
    noFaceDetected: () => speak("No face detected in camera feed. Please ensure your face is clearly visible."),
    
    // System messages
    systemError: (msg) => speak(msg),
    loading: () => speak("Please wait while we process your request."),
    success: (msg) => speak(msg),
    error: (msg) => speak(msg)
};
