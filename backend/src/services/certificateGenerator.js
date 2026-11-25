import PDFDocument from 'pdfkit';
import { generateQRBuffer } from './qrGenerator.js';

/**
 * Generate a professional landscape PDF certificate using PDFKit.
 * Preserves the original EventHub Certificate design & branding:
 * Deep Purple (#211039), Dark Violet (#54258D), and Lavender (#A66BEE / #D9C1FF) accents.
 *
 * @param {Object} certificate - Certificate data object
 * @param {string} clientUrl - Base URL of the client app for QR verification
 * @returns {Promise<PDFDocument>}
 */
export async function createCertificatePDF(certificate, clientUrl = 'http://localhost:5173') {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: `EventHub Certificate - ${certificate.certificateId}`,
      Author: 'EventHub Platform',
      Subject: `Certificate of Participation for ${certificate.participantName}`,
      Keywords: 'certificate, eventhub, participation, hackathon, verified',
    },
  });

  const width = doc.page.width;
  const height = doc.page.height;

  // 1. Soft ivory background fill
  doc.rect(0, 0, width, height).fill('#FCFBF8');

  // 2. Outer Deep Purple Border
  doc.save();
  doc.lineWidth(4)
    .strokeColor('#211039')
    .rect(24, 24, width - 48, height - 48)
    .stroke();

  // 3. Inner Lavender Accent Border
  doc.lineWidth(1.2)
    .strokeColor('#A66BEE')
    .rect(32, 32, width - 64, height - 64)
    .stroke();

  // 4. Fine innermost border
  doc.lineWidth(0.5)
    .strokeColor('#54258D')
    .rect(36, 36, width - 72, height - 72)
    .stroke();

  // 5. Decorative Corner Accents
  const cornerSize = 20;
  const drawCorner = (x, y, dx, dy) => {
    doc.lineWidth(2)
      .strokeColor('#D9C1FF')
      .moveTo(x, y + dy * cornerSize)
      .lineTo(x, y)
      .lineTo(x + dx * cornerSize, y)
      .stroke();
  };
  drawCorner(42, 42, 1, 1);
  drawCorner(width - 42, 42, -1, 1);
  drawCorner(42, height - 42, 1, -1);
  drawCorner(width - 42, height - 42, -1, -1);
  doc.restore();

  // 6. Header Branding
  doc.fontSize(13)
    .font('Helvetica-Bold')
    .fillColor('#A66BEE')
    .text('✦  E V E N T H U B  ✦', 0, 56, { align: 'center', characterSpacing: 4 });

  doc.fontSize(9)
    .font('Helvetica')
    .fillColor('#54258D')
    .text('CAMPUS EVENT & HACKATHON EXCELLENCE PORTAL', 0, 74, {
      align: 'center',
      characterSpacing: 2,
    });

  // Subtle decorative divider
  doc.save()
    .lineWidth(1)
    .strokeColor('#D9C1FF')
    .moveTo(width / 2 - 120, 92)
    .lineTo(width / 2 + 120, 92)
    .stroke()
    .restore();

  // 7. Certificate Main Heading
  doc.fontSize(28)
    .font('Helvetica-Bold')
    .fillColor('#211039')
    .text('CERTIFICATE OF PARTICIPATION', 0, 110, {
      align: 'center',
      characterSpacing: 1.5,
    });

  // 8. Recipient lead
  doc.fontSize(11)
    .font('Helvetica-Oblique')
    .fillColor('#666666')
    .text('This is to certify that', 0, 160, { align: 'center' });

  // 9. Participant Name
  doc.fontSize(32)
    .font('Helvetica-Bold')
    .fillColor('#211039')
    .text(certificate.participantName || 'Participant Name', 0, 185, { align: 'center' });

  // Decorative under-name divider line
  const nameWidth = doc.widthOfString(certificate.participantName || 'Participant Name');
  const startX = Math.max(width / 2 - nameWidth / 2 - 20, width / 2 - 160);
  const endX = Math.min(width / 2 + nameWidth / 2 + 20, width / 2 + 160);
  doc.save()
    .lineWidth(1.5)
    .strokeColor('#A66BEE')
    .moveTo(startX, 230)
    .lineTo(endX, 230)
    .stroke()
    .restore();

  // 10. Statement & Event Name
  doc.fontSize(12)
    .font('Helvetica')
    .fillColor('#4A4A4A')
    .text('has successfully participated in and contributed to', 0, 248, { align: 'center' });

  doc.fontSize(22)
    .font('Helvetica-Bold')
    .fillColor('#54258D')
    .text(certificate.eventName || 'EventHub Event', 0, 272, { align: 'center' });

  // 11. Event details
  const formattedDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#666666')
    .text(
      `Date of Event: ${certificate.eventDate || formattedDate}  •  Conducted under the auspices of EventHub`,
      0,
      310,
      { align: 'center' }
    );

  // Revocation banner if revoked
  if (certificate.status === 'revoked') {
    doc.save();
    doc.rect(width / 2 - 160, 335, 320, 28)
      .fillColor('#FEE2E2')
      .fill();
    doc.lineWidth(1)
      .strokeColor('#EF4444')
      .rect(width / 2 - 160, 335, 320, 28)
      .stroke();
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#DC2626')
      .text('⚠ CERTIFICATE REVOKED - VOID & INVALID', 0, 343, { align: 'center' });
    doc.restore();
  }

  // 12. Bottom Section: Left Metadata, Center Signature, Right QR Code
  const bottomY = 410;

  // A. Left Column: Certificate Metadata
  doc.fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#211039')
    .text('CERTIFICATE DETAILS', 60, bottomY);

  doc.fontSize(8.5)
    .font('Helvetica')
    .fillColor('#555555')
    .text(`Certificate ID: ${certificate.certificateId}`, 60, bottomY + 18)
    .text(`Issued Date: ${formattedDate}`, 60, bottomY + 34)
    .text(
      `Verification Status: ${certificate.status === 'revoked' ? 'REVOKED' : 'VALID & AUTHENTIC'}`,
      60,
      bottomY + 50
    );

  // B. Center Column: Official Signatures
  doc.save();
  doc.lineWidth(1)
    .strokeColor('#211039')
    .moveTo(width / 2 - 140, bottomY + 45)
    .lineTo(width / 2 - 10, bottomY + 45)
    .stroke();

  doc.lineWidth(1)
    .strokeColor('#211039')
    .moveTo(width / 2 + 15, bottomY + 45)
    .lineTo(width / 2 + 145, bottomY + 45)
    .stroke();
  doc.restore();

  doc.fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#211039')
    .text('Dr. Rajesh Sharma', width / 2 - 140, bottomY + 52, { width: 130, align: 'center' })
    .text('Ananya Deshmukh', width / 2 + 15, bottomY + 52, { width: 130, align: 'center' });

  doc.fontSize(7.5)
    .font('Helvetica')
    .fillColor('#777777')
    .text('Faculty Coordinator', width / 2 - 140, bottomY + 66, { width: 130, align: 'center' })
    .text('Lead Organizer, EventHub', width / 2 + 15, bottomY + 66, {
      width: 130,
      align: 'center',
    });

  // C. Right Column: Verification QR Code
  const verifyUrl = `${clientUrl.replace(/\/$/, '')}/verify/${certificate.certificateId}`;
  const qrBuffer = await generateQRBuffer(verifyUrl);

  const qrX = width - 170;
  const qrY = bottomY - 15;
  const qrSize = 85;

  doc.save();
  doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8)
    .fillColor('#FFFFFF')
    .fill();
  doc.lineWidth(1)
    .strokeColor('#D9C1FF')
    .rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8)
    .stroke();
  doc.restore();

  doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

  doc.fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor('#211039')
    .text('Scan to Verify', qrX - 15, qrY + qrSize + 8, { width: qrSize + 30, align: 'center' });

  doc.fontSize(6.5)
    .font('Helvetica')
    .fillColor('#888888')
    .text('or visit eventhub/verify', qrX - 15, qrY + qrSize + 19, {
      width: qrSize + 30,
      align: 'center',
    });

  doc.end();
  return doc;
}
