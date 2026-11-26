import PDFDocument from 'pdfkit';
import { generateQRBuffer } from './qrGenerator.js';

/**
 * Generate a printable digital Event Pass PDF using PDFKit.
 * Encodes only the opaque passToken inside the QR code (zero PII).
 */
export async function createEventPassPDF(passData) {
  const doc = new PDFDocument({
    size: 'A5',
    layout: 'portrait',
    margins: { top: 28, bottom: 28, left: 28, right: 28 },
    info: {
      Title: `EventHub Pass - ${passData.registrationCode}`,
      Author: 'EventHub Platform',
      Subject: `Entry Pass for ${passData.eventTitle}`,
    },
  });

  const width = doc.page.width;
  const height = doc.page.height;

  // Background
  doc.rect(0, 0, width, height).fill('#FAF9FD');

  // Top cosmic purple header
  doc.rect(0, 0, width, 118).fill('#211039');
  doc.rect(0, 112, width, 6).fill('#7C3AED');

  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#D9C1FF')
    .text('EVENTHUB DIGITAL ENTRY PASS', 28, 28, { characterSpacing: 1.8 });

  doc.fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#FFFFFF')
    .text(passData.eventTitle || 'Campus Event', 28, 50, {
      width: width - 56,
      ellipsis: true,
    });

  doc.fontSize(9.5)
    .font('Helvetica')
    .fillColor('#E9D5FF')
    .text(`${passData.eventCategory || 'Event'}  •  Status: ${passData.displayStatus}`, 28, 86);

  // Pass card container
  doc.save();
  doc.roundedRect(24, 138, width - 48, height - 170, 14)
    .fillColor('#FFFFFF')
    .fill();
  doc.lineWidth(1)
    .strokeColor('#E5DDFB')
    .roundedRect(24, 138, width - 48, height - 170, 14)
    .stroke();
  doc.restore();

  // Attendee & Event Details
  let y = 160;
  const drawField = (label, value, colX = 42, fieldWidth = width - 84) => {
    doc.fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#766E8F')
      .text(label.toUpperCase(), colX, y, { characterSpacing: 0.8 });
    doc.fontSize(11.5)
      .font('Helvetica-Bold')
      .fillColor('#1A1230')
      .text(value || '—', colX, y + 12, { width: fieldWidth });
  };

  drawField('Participant', passData.studentName);
  y += 40;
  drawField('Student ID & College', `${passData.studentIdNumber || '—'} • ${passData.collegeName || 'Campus'}`);
  y += 40;

  const formattedDate = passData.eventDate
    ? new Date(passData.eventDate).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Date TBA';

  drawField('Event Date & Time', formattedDate, 42, 170);
  drawField('Venue', passData.eventVenue || 'Campus Venue', 220, width - 262);
  y += 44;
  drawField('Registration ID', passData.registrationCode || passData.registrationId);

  // QR Code Box (contains opaque passToken only)
  const qrBuffer = await generateQRBuffer(passData.passToken);
  const qrSize = 150;
  const qrX = (width - qrSize) / 2;
  const qrY = y + 46;

  doc.save();
  doc.roundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 12)
    .fillColor('#FAF8FF')
    .fill();
  doc.lineWidth(1)
    .strokeColor('#D8CFF5')
    .roundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 12)
    .stroke();
  doc.restore();

  doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

  doc.fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor('#54258D')
    .text('Present this QR code at the event check-in desk', 28, qrY + qrSize + 20, {
      width: width - 56,
      align: 'center',
    });

  doc.fontSize(7.5)
    .font('Helvetica')
    .fillColor('#766E8F')
    .text('Verified by EventHub Backend • Single-use entry token', 28, qrY + qrSize + 34, {
      width: width - 56,
      align: 'center',
    });

  doc.end();
  return doc;
}
