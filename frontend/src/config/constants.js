// Email Domain Configuration
// Set this to your allowed email domain (e.g., '@nriit.edu.in')
// Leave empty ('') to allow all email domains
export const ALLOWED_EMAIL_DOMAIN = '@nriit.edu.in';

/**
 * Validates if an email matches the allowed domain
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmailDomain = (email) => {
    if (!email) return false;

    // If no domain restriction, allow all emails
    if (!ALLOWED_EMAIL_DOMAIN || ALLOWED_EMAIL_DOMAIN.trim() === '') {
        return true;
    }

    // Check if email ends with the allowed domain
    return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase());
};

/**
 * Get error message for invalid domain
 * @returns {string} - Error message
 */
export const getEmailDomainError = () => {
    if (!ALLOWED_EMAIL_DOMAIN || ALLOWED_EMAIL_DOMAIN.trim() === '') {
        return 'Invalid email address';
    }
    return `Only ${ALLOWED_EMAIL_DOMAIN} emails are allowed`;
};
