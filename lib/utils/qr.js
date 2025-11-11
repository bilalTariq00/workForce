/**
 * Universal QR Code Data
 * This is the same QR code for all users
 * The system identifies the user from their session
 */
export const UNIVERSAL_QR_DATA = {
  type: 'attendance',
  version: '1.0',
};

export const UNIVERSAL_QR_CODE = JSON.stringify(UNIVERSAL_QR_DATA);

/**
 * Validate QR code
 * @param {string} qrData - Scanned QR code data
 * @returns {boolean} True if valid
 */
export function validateQRCode(qrData) {
  try {
    const parsed = JSON.parse(qrData);
    return parsed.type === 'attendance' && parsed.version === '1.0';
  } catch (error) {
    return false;
  }
}

