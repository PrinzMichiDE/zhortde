import QRCode from 'qrcode';

export type QRCodeFormat = 'png' | 'svg';

export type QRCodeOptions = {
  format: QRCodeFormat;
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
};

/**
 * Generate QR code as data URL (for inline display)
 */
export async function generateQRCodeDataUrl(
  url: string,
  options: QRCodeOptions = { format: 'png' }
): Promise<string> {
  const qrOptions = {
    width: options.width || 300,
    margin: options.margin || 2,
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
  };

  if (options.format === 'svg') {
    return QRCode.toString(url, {
      type: 'svg',
      ...qrOptions,
    });
  }

  return QRCode.toDataURL(url, qrOptions);
}

/**
 * Generate QR code as buffer (for download)
 */
export async function generateQRCodeBuffer(
  url: string,
  options: QRCodeOptions = { format: 'png' }
): Promise<Buffer> {
  const qrOptions = {
    width: options.width || 300,
    margin: options.margin || 2,
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
  };

  if (options.format === 'svg') {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      ...qrOptions,
    });
    return Buffer.from(svg, 'utf-8');
  }

  return QRCode.toBuffer(url, {
    type: 'png',
    ...qrOptions,
  });
}

/**
 * Get content type for QR code format
 */
export function getQRCodeContentType(format: QRCodeFormat): string {
  return format === 'svg' ? 'image/svg+xml' : 'image/png';
}

