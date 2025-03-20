// EPIC number validation utility

/**
 * Validates an EPIC number format
 * Format: 3 or 4 uppercase letters followed by 6 or 7 digits
 * Total length must be 10 characters
 */
export const validateEpicNumber = (epicNumber) => {
    // Check if the EPIC number is exactly 10 characters
    if (epicNumber.length !== 10) {
        return {
            isValid: false,
            message: 'EPIC number must be exactly 10 characters'
        };
    }

    // Check if it matches the pattern: 3-4 letters followed by 6-7 digits
    const epicPattern = /^[A-Z]{3,4}[0-9]{6,7}$/;
    const isValidFormat = epicPattern.test(epicNumber);

    if (!isValidFormat) {
        return {
            isValid: false,
            message: 'EPIC number is not in the required format'
        };
    }

    return {
        isValid: true,
        message: ''
    };
};
