import QRCode from 'qrcode';

/**
 * Generate a QR code as a PNG Buffer for embedding into PDFKit.
 * @param {string} text - URL or opaque token to encode
 * @returns {Promise<Buffer>}
 */
export async function generateQRBuffer(text) {
  return QRCode.toBuffer(text, {
    type: 'png',
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 140,
    color: {
      dark: '#211039',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate a QR code as a Data URL for frontend display.
 * @param {string} text - URL or opaque token to encode
 * @returns {Promise<string>}
 */
export async function generateQRDataURL(text) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 220,
    color: {
      dark: '#211039',
      light: '#FFFFFF',
    },
  });
}
