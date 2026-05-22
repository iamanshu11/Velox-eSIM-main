import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface InvoicePdfData {
  invoiceNumber: string;
  amount: number;
  currency?: string;
  description: string;
  issuedAt: Date;
  orderReference?: string;
  activationCode?: string;
  customerName?: string;
  customerEmail?: string;
}

const GREEN = '#43A1F0';
const GREEN_LIGHT = '#f0f7fe';
const GREEN_BORDER = '#c1e1f9';
const GREEN_MED = '#2a7dd4';
const BEIGE = '#f1f5f9';
const BORDER = '#e2e8f0';
const TEXT_PRIMARY = '#0f172a';
const TEXT_SECONDARY = '#334155';
const TEXT_MUTED = '#64748b';
const WHITE = '#ffffff';

export function buildActivationUrls(activationCode: string): { android: string; ios: string } {
  const sanitizedCode = activationCode.replace(/[^A-Za-z0-9]/g, '')
  const cardData = `LPA:1$rsp-eu.simlessly.com$${sanitizedCode}`
  return {
    android: `https://esimsetup.android.com/esim_qrcode_provisioning/?carddata=${cardData}`,
    ios: `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${cardData}`,
  }
}

export async function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  const {
    invoiceNumber,
    amount,
    currency = 'USD',
    description,
    issuedAt,
    orderReference = 'N/A',
    activationCode,
    customerName,
    customerEmail,
  } = data;

  const activationUrls = activationCode ? buildActivationUrls(activationCode) : undefined;

  const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Invoice ${invoiceNumber}`, Author: 'Velox eSIM' } });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 595;     
    const M = 48;      
    const contentW = W - M * 2;
    doc.rect(0, 0, W, 100).fill(GREEN);
    doc.fillColor(WHITE).fontSize(22).font('Helvetica-Bold')
      .text('Velox eSIM', M, 26);
    doc.fillColor('rgba(255,255,255,0.65)').fontSize(11).font('Helvetica')
      .text('Global eSIM, Instant Connectivity', M, 54);
    doc.fillColor(WHITE).fontSize(28).font('Helvetica-Bold')
      .text('INVOICE', 0, 30, { width: W - M, align: 'right' });
    let y = 116;
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica')
      .text('INVOICE NUMBER', M, y);
    doc.fillColor(TEXT_PRIMARY).fontSize(13).font('Helvetica-Bold')
      .text(invoiceNumber, M, y + 13);

    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica')
      .text('DATE ISSUED', M, y + 36);
    doc.fillColor(TEXT_PRIMARY).fontSize(11).font('Helvetica')
      .text(issuedAt.toDateString(), M, y + 49);

    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica')
      .text('ORDER REFERENCE', M, y + 72);
    doc.fillColor(TEXT_PRIMARY).fontSize(11).font('Helvetica')
      .text(orderReference, M, y + 85);
    if (customerName || customerEmail) {
      const rightX = W / 2 + 20;
      doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica')
        .text('BILLED TO', rightX, y);
      if (customerName) {
        doc.fillColor(TEXT_PRIMARY).fontSize(12).font('Helvetica-Bold')
          .text(customerName, rightX, y + 13);
      }
      if (customerEmail) {
        doc.fillColor(TEXT_SECONDARY).fontSize(11).font('Helvetica')
          .text(customerEmail, rightX, customerName ? y + 29 : y + 13);
      }
    }

    y = 230;
    doc.rect(M, y, contentW, 1).fill(BORDER);
    y += 16;
    doc.rect(M, y, contentW, 28).fill('#f9f7f4');
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Bold')
      .text('DESCRIPTION', M + 12, y + 9);
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Bold')
      .text('CURRENCY', W - M - 160, y + 9);
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Bold')
      .text('AMOUNT', W - M - 70, y + 9);
    y += 28;
    doc.rect(M, y, contentW, 40).fill(WHITE);
    doc.rect(M, y, contentW, 40).stroke(BORDER);
    doc.fillColor(TEXT_PRIMARY).fontSize(11).font('Helvetica')
      .text(description, M + 12, y + 13, { width: contentW - 200 });
    doc.fillColor(TEXT_SECONDARY).fontSize(11).font('Helvetica')
      .text(currency, W - M - 160, y + 13);
    doc.fillColor(TEXT_PRIMARY).fontSize(11).font('Helvetica-Bold')
      .text(`$${amount.toFixed(2)}`, W - M - 70, y + 13);
    y += 40;
    y += 8;
    doc.rect(W - M - 200, y, 200, 52).fill(GREEN);
    doc.fillColor('rgba(255,255,255,0.7)').fontSize(10).font('Helvetica')
      .text('TOTAL DUE', W - M - 190, y + 10);
    doc.fillColor(WHITE).fontSize(20).font('Helvetica-Bold')
      .text(`$${amount.toFixed(2)}`, W - M - 190, y + 25, { width: 180, align: 'right' });
    y += 72;
    if (activationCode && activationUrls) {
      y += 8;
      doc.rect(M, y, contentW, 1).fill(BORDER);
      y += 16;

      doc.fillColor(GREEN).fontSize(13).font('Helvetica-Bold')
        .text('eSIM Activation Details', M, y);
      y += 20;

      doc.fillColor(TEXT_SECONDARY).fontSize(10).font('Helvetica')
        .text('Use one of the one-click links below or enter the manual code in your device settings.', M, y, { width: contentW });
      y += 22;
      doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica-Bold')
        .text('Android: ', M, y, { continued: true });
      doc.fillColor(GREEN_MED).font('Helvetica')
        .text(activationUrls.android, { lineBreak: false });
      y += 18;
      doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica-Bold')
        .text('iPhone:  ', M, y, { continued: true });
      doc.fillColor(GREEN_MED).font('Helvetica')
        .text(activationUrls.ios, { lineBreak: false });
      y += 24;
      doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica')
        .text('Manual activation code:', M, y);
      y += 14;
      doc.rect(M, y, contentW, 30).fill(GREEN_LIGHT);
      doc.rect(M, y, contentW, 30).stroke(GREEN_BORDER);
      doc.fillColor(GREEN).fontSize(12).font('Helvetica-Bold')
        .text(activationCode, M + 12, y + 9, { width: contentW - 24 });
      y += 46;
    }
    doc.rect(0, 794, W, 48).fill(BEIGE);
    doc.rect(0, 794, W, 1).fill(BORDER);
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica')
      .text(
        `© ${new Date().getFullYear()} Velox eSIM. This document is an official invoice for your records.`,
        M,
        806,
        { width: contentW, align: 'center' }
      );
    if (activationUrls) {
      QRCode.toBuffer(activationUrls.android, { type: 'png', width: 260, margin: 2 })
        .then((qrBuffer: Buffer) => {
          doc.addPage();
          doc.rect(0, 0, W, 80).fill(GREEN);
          doc.fillColor(WHITE).fontSize(20).font('Helvetica-Bold')
            .text('Scan to Activate Your eSIM', M, 26, { width: contentW, align: 'center' });
          const qrSize = 230;
          const qrX = (W - qrSize) / 2;
          doc.rect(qrX - 12, 100, qrSize + 24, qrSize + 24).fill(WHITE);
          doc.rect(qrX - 12, 100, qrSize + 24, qrSize + 24).stroke(GREEN_BORDER);
          doc.image(qrBuffer, qrX, 112, { width: qrSize, height: qrSize });

          let qy = 100 + qrSize + 40;
          doc.fillColor(TEXT_SECONDARY).fontSize(11).font('Helvetica')
            .text('Tap or scan this QR code on your Android device to activate the eSIM.', M, qy, { width: contentW, align: 'center' });
          qy += 22;

          doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold')
            .text('ANDROID LINK', M, qy, { width: contentW, align: 'center' });
          qy += 12;
          doc.fillColor(GREEN_MED).fontSize(9).font('Helvetica')
            .text(activationUrls.android, M, qy, { width: contentW, align: 'center' });
          qy += 24;

          doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica')
            .text('For iPhone, use the iOS link provided in your email.', M, qy, { width: contentW, align: 'center' });
          qy += 30;
          const codeX = (W - 300) / 2;
          doc.rect(codeX, qy, 300, 34).fill(GREEN_LIGHT);
          doc.rect(codeX, qy, 300, 34).stroke(GREEN_BORDER);
          doc.fillColor(GREEN).fontSize(11).font('Helvetica-Bold')
            .text(activationCode!, codeX + 12, qy + 10, { width: 276, align: 'center' });
          doc.rect(0, 794, W, 48).fill(BEIGE);
          doc.rect(0, 794, W, 1).fill(BORDER);
          doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica')
            .text(
              `© ${new Date().getFullYear()} Velox eSIM. Invoice ${invoiceNumber}.`,
              M, 806, { width: contentW, align: 'center' }
            );

          doc.end();
        })
        .catch(reject);
    } else {
      doc.end();
    }
  });
}
