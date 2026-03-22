// Resume text extraction - supports PDF and DOCX

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker - use local bundle instead of CDN for mobile compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractTextFromResume(file) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return extractFromPDF(file);
  } else if (fileName.endsWith('.docx')) {
    return extractFromDOCX(file);
  } else if (fileName.endsWith('.doc')) {
    throw new Error('Old .doc format is not supported. Please convert to .docx or .pdf');
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
  }
}

async function extractFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF. Please try again.');
  }
}

async function extractFromDOCX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    throw new Error('Failed to extract text from DOCX. Please try again.');
  }
}
