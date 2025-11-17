export const addDigitalSignatureToPDF = async (
  pdfArrayBuffer: ArrayBuffer,
  latitude?: number | null,
  longitude?: number | null
) => {
  try {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

    const employeeUsername = 'SELVA RAJ BABU';

    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const timestamp = `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;

    const baseSignatureLines = [
      `${employeeUsername}`,
      `Digitally signed`,
      `by ${employeeUsername}`,
      `Date:`,
      `${timestamp}`
    ];

    const signatureLines = latitude && longitude
      ? [...baseSignatureLines, `Location: Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`]
      : baseSignatureLines;

    const nameFontSize = 16;
    const fontSize = 10;
    const lineHeight = 12;
    const nameLineHeight = 18;
    const padding = 12;

    const nameWidth = boldFont.widthOfTextAtSize(signatureLines[0], nameFontSize);
    const otherLinesWidth = Math.max(...signatureLines.slice(1).map(line => font.widthOfTextAtSize(line, fontSize)));
    const maxLineWidth = Math.max(nameWidth, otherLinesWidth);
    const blockWidth = maxLineWidth + padding * 2;
    const blockHeight = nameLineHeight + (signatureLines.length - 1) * lineHeight + padding * 2;

    const margin = 20;
    const x = width - blockWidth - margin;
    const y = margin + padding;

    lastPage.drawRectangle({
      x: x - padding,
      y: y - padding,
      width: blockWidth,
      height: blockHeight,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 1,
      color: rgb(0.95, 0.95, 0.95)
    });

    signatureLines.forEach((line, index) => {
      const isName = index === 0;
      const currentFontSize = isName ? nameFontSize : fontSize;

      let yPosition;
      if (index === 0) {
        yPosition = y + blockHeight - padding - nameLineHeight;
      } else {
        yPosition = y + blockHeight - padding - nameLineHeight - index * lineHeight;
      }

      lastPage.drawText(line, {
        x: x,
        y: yPosition,
        size: currentFontSize,
        font: isName ? boldFont : font,
        color: isName ? rgb(0, 0.5, 0) : rgb(0, 0, 0)
      });
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error('Error adding digital signature:', error);
    throw error;
  }
};
