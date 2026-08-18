import React from 'react';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export async function downloadCardAsPng(element: HTMLElement, filename: string): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 3.5,
      cacheBust: true,
      quality: 1.0,
    });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF9933', '#FFFFFF', '#138808', '#000080'],
    });
  } catch (err) {
    console.error('PNG download error:', err);
    throw err;
  }
}

export async function downloadCardAsJpeg(element: HTMLElement, filename: string): Promise<void> {
  try {
    const dataUrl = await toJpeg(element, {
      pixelRatio: 3.5,
      cacheBust: true,
      quality: 0.98,
    });
    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('JPEG download error:', err);
    throw err;
  }
}

export async function downloadCardAsPdf(element: HTMLElement, filename: string): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 3.5,
      cacheBust: true,
      quality: 1.0,
    });

    // Standard CR80 ID Card dimensions: 85.6mm x 53.98mm (or portrait: 54mm x 86mm)
    const isLandscape = element.offsetWidth > element.offsetHeight;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: isLandscape ? [85.6, 54] : [54, 85.6],
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF9933', '#FFFFFF', '#138808', '#000080'],
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    throw err;
  }
}
