// Utility functions for text-to-speech functionality

const synth = window.speechSynthesis;

// Initialize voices
let voices = [];

// Load voices when they're available
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {
        voices = synth.getVoices();
    };
}

// Function to get the best female English voice
const getFemaleVoice = () => {
    if (voices.length === 0) {
        voices = synth.getVoices();
    }
    
    // Try to find a female English voice with specific criteria
    const femaleVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('girl') ||
            voice.name.toLowerCase().includes('female-') ||
            voice.name.toLowerCase().includes('female_')
        )
    );
    
    // If no female voice found, try to find any English voice
    if (!femaleVoice) {
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
            // Adjust pitch to make it sound more feminine
            return englishVoice;
        }
    }
    
    // Fallback to any available voice
    return femaleVoice || voices[0];
};

// Function to speak a message
export const speak = (message) => {
    // Cancel any ongoing speech
    synth.cancel();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(message);
    
    // Set properties for the voice
    utterance.rate = 1.0;  // Normal speed
    utterance.pitch = 1.2; // Slightly higher pitch for more feminine sound
    utterance.volume = 1.0; // Full volume
    
    // Set female voice
    utterance.voice = getFemaleVoice();

    // Speak the message
    synth.speak(utterance);
};

// Function to stop speaking
export const stopSpeaking = () => {
    synth.cancel();
};

// Predefined voice messages
export const VoiceMessages = {
    // EPIC number related messages
    epicNotFound: () => speak("EPIC number not found in the database."),
    wrongPollingStation: () => speak("Voter does not belong to this polling station."),
    duplicateVote: () => speak("Voter has already cast their vote."),
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
