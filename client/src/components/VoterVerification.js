// ... existing imports ...
import { verifyFaceWithServer } from '../utils/faceVerificationApi';

// In your verification component, after EPIC verification:
const handleFaceVerification = async () => {
    try {
        const videoElement = document.getElementById('faceVideo'); // Make sure this ID matches your video element
        const result = await verifyFaceWithServer(videoElement);
        
        if (result.success) {
            // Proceed with successful verification
            console.log('Face verification successful');
        } else {
            // Handle verification failure
            console.error('Face verification failed:', result.message);
        }
    } catch (error) {
        console.error('Error during face verification:', error);
    }
};