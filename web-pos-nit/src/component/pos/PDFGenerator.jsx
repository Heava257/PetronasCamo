// PDFUtils.js - Utility functions for PDF generation
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export class PDFGenerator {
  constructor() {
    this.defaultOptions = {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      foreignObjectRendering: false,
      removeContainer: true,
      imageTimeout: 0,
      scrollX: 0,
      scrollY: 0
    };
  }

  // Generate filename with proper sanitization
  generateFileName(objSummary, selectedLocations, customPrefix = 'វិក្កយប័ត្រ') {
    try {
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }).replace(':', '-');
      
      // Extract customer information
      const customerName = objSummary?.customer_name || 
                          objSummary?.clientName || 
                          selectedLocations?.[0]?.name || 
                          'Customer';
      
      const invoiceNumber = objSummary?.invoice_number || 
                           objSummary?.invoiceId || 
                           objSummary?.id ||
                           `INV-${Date.now().toString().slice(-6)}`;
      
      // Sanitize filename components
      const cleanCustomerName = this.sanitizeFileName(customerName, 15);
      const cleanInvoiceNumber = this.sanitizeFileName(invoiceNumber, 10);
      
      return `${customPrefix}_${cleanCustomerName}_${cleanInvoiceNumber}_${date}_${time}.pdf`;
    } catch (error) {
      console.error('Error generating filename:', error);
      return `${customPrefix}_${new Date().toISOString().split('T')[0]}.pdf`;
    }
  }

  // Sanitize filename to remove invalid characters
  sanitizeFileName(str, maxLength = 20) {
    if (!str) return 'Unknown';
    
    return str
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Remove invalid characters
      .replace(/[^\w\s\u1780-\u17FF.-]/g, '_') // Keep only word chars, Khmer, dots, hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .substring(0, maxLength)
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  }

  // Prepare DOM element for canvas capture
  async prepareElement(element) {
    if (!element) {
      throw new Error('Element not found for PDF generation');
    }

    try {
      // Store original styles
      const originalStyles = {
        position: element.style.position,
        top: element.style.top,
        left: element.style.left,
        transform: element.style.transform,
        zIndex: element.style.zIndex
      };

      // Apply temporary styles for better capture
      element.style.position = 'relative';
      element.style.top = '0';
      element.style.left = '0';
      element.style.transform = 'none';
      element.style.zIndex = '9999';

      // Wait for rendering
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 200);
        });
      });

      // Handle images
      await this.waitForImages(element);

      // Return cleanup function
      return () => {
        Object.keys(originalStyles).forEach(key => {
          if (originalStyles[key]) {
            element.style[key] = originalStyles[key];
          } else {
            element.style.removeProperty(key);
          }
        });
      };
    } catch (error) {
      console.warn('Error preparing element:', error);
      return () => {}; // Return empty cleanup
    }
  }

  // Wait for all images to load
  async waitForImages(element) {
    const images = Array.from(element.querySelectorAll('img'));
    
    const imagePromises = images.map(img => {
      return new Promise((resolve) => {
        if (img.complete && img.naturalHeight !== 0) {
          resolve();
        } else {
          const timeoutId = setTimeout(() => {
            // Replace with placeholder if timeout
            img.src = this.getPlaceholderImage();
            resolve();
          }, 3000);

          const handleLoad = () => {
            clearTimeout(timeoutId);
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
            resolve();
          };

          const handleError = () => {
            clearTimeout(timeoutId);
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
            img.src = this.getPlaceholderImage();
            resolve();
          };

          img.addEventListener('load', handleLoad);
          img.addEventListener('error', handleError);
        }
      });
    });

    await Promise.all(imagePromises);
  }

  // Get placeholder image for broken images
  getPlaceholderImage() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Im0xNSA5LTYgNi02LTYiIHN0cm9rZT0iIzY5NzA3YiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
  }

  // Enhanced canvas generation with better options
  async generateCanvas(element, customOptions = {}) {
    const options = {
      ...this.defaultOptions,
      ...customOptions,
      ignoreElements: (el) => {
        if (!el || !el.tagName) return true;
        
        const tagName = el.tagName.toLowerCase();
        const classList = el.classList || [];
        
        return (
          classList.contains('no-print') ||
          classList.contains('hidden') ||
          tagName === 'script' ||
          tagName === 'style' ||
          tagName === 'noscript' ||
          tagName === 'meta' ||
          tagName === 'link' ||
          el.style.display === 'none' ||
          el.style.visibility === 'hidden'
        );
      },
      onclone: (clonedDoc) => {
        this.enhanceClonedDocument(clonedDoc);
      }
    };

    const canvas = await html2canvas(element, options);
    
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas generation failed - invalid dimensions');
    }

    return canvas;
  }

  // Enhance cloned document for better rendering
  enhanceClonedDocument(clonedDoc) {
    try {
      // Remove problematic elements
      const elementsToRemove = clonedDoc.querySelectorAll(
        '.no-print, script, style, noscript, meta, link[rel="stylesheet"]'
      );
      elementsToRemove.forEach(el => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });

      // Add enhanced styles
      const style = clonedDoc.createElement('style');
      style.textContent = `
        * {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
          background: white !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }
        .invoice-content {
          background: white !important;
          width: 100% !important;
          position: relative !important;
          transform: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        table {
          border-collapse: collapse !important;
          width: 100% !important;
        }
        * {
          font-family: 'Khmer OS', Arial, sans-serif !important;
        }
      `;
      
      if (clonedDoc.head) {
        clonedDoc.head.appendChild(style);
      }

      // Ensure visibility
      const allElements = clonedDoc.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.style) {
          if (el.style.display === 'none') el.style.display = 'block';
          if (el.style.visibility === 'hidden') el.style.visibility = 'visible';
        }
      });
    } catch (error) {
      console.warn('Error enhancing cloned document:', error);
    }
  }

  // Generate PDF with multi-page support
  async generatePDF(canvas, filename, options = {}) {
    const {
      orientation = 'portrait',
      unit = 'mm',
      format = 'a4',
      compress = true,
      margin = 10
    } = options;

    const pdf = new jsPDF({
      orientation,
      unit,
      format,
      compress
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Handle multi-page PDFs
    if (imgHeight > pdfHeight - (margin * 2)) {
      const totalPages = Math.ceil(imgHeight / (pdfHeight - (margin * 2)));
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        
        const sourceY = (i * (pdfHeight - (margin * 2)) * canvas.width) / imgWidth;
        const sourceHeight = Math.min(
          ((pdfHeight - (margin * 2)) * canvas.width) / imgWidth,
          canvas.height - sourceY
        );
        
        // Create page canvas
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext('2d');
        
        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );
        
        const pageImgData = pageCanvas.toDataURL('image/png', 0.9);
        pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pdfHeight - (margin * 2));
      }
    } else {
      const imgData = canvas.toDataURL('image/png', 0.9);
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    }
    
    // Save PDF
    pdf.save(filename);
    return pdf;
  }

  // Complete PDF generation workflow
  async generatePDFFromElement(element, objSummary, selectedLocations, options = {}) {
    const {
      filename,
      customPrefix = 'វិក្កយប័ត្រ',
      canvasOptions = {},
      pdfOptions = {},
      onProgress
    } = options;

    try {
      // Step 1: Generate filename
      const autoFilename = filename || this.generateFileName(objSummary, selectedLocations, customPrefix);
      if (onProgress) onProgress('Generating filename...', 10);

      // Step 2: Prepare element
      if (onProgress) onProgress('Preparing element...', 20);
      const cleanup = await this.prepareElement(element);

      // Step 3: Generate canvas
      if (onProgress) onProgress('Creating canvas...', 50);
      const canvas = await this.generateCanvas(element, canvasOptions);

      // Step 4: Cleanup
      cleanup();

      // Step 5: Generate PDF
      if (onProgress) onProgress('Generating PDF...', 80);
      const pdf = await this.generatePDF(canvas, autoFilename, pdfOptions);

      if (onProgress) onProgress('Complete!', 100);
      
      return {
        success: true,
        filename: autoFilename,
        pdf
      };

    } catch (error) {
      console.error('PDF generation failed:', error);
      
      if (onProgress) onProgress('Error occurred', 0);
      
      return {
        success: false,
        error: error.message,
        fallbackFilename: this.generateFileName(objSummary, selectedLocations, customPrefix)
      };
    }
  }

  // Create fallback PDF on error
  async createFallbackPDF(objSummary, selectedLocations, filename) {
    try {
      const pdf = new jsPDF();
      
      // Add content to fallback PDF
      pdf.setFontSize(20);
      pdf.text('Invoice / វិក្កយប័ត្រ', 20, 30);
      
      pdf.setFontSize(12);
      pdf.text('Error generating detailed PDF.', 20, 50);
      pdf.text('សូមទាក់ទងអ្នកគាំទ្រ / Please contact support.', 20, 65);
      
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 85);
      
      if (objSummary) {
        if (objSummary.customer_name) {
          pdf.text(`Customer: ${objSummary.customer_name}`, 20, 100);
        }
        if (objSummary.total) {
          pdf.text(`Total: $${objSummary.total}`, 20, 115);
        }
        if (objSummary.invoice_number) {
          pdf.text(`Invoice #: ${objSummary.invoice_number}`, 20, 130);
        }
      }
      
      const fallbackFilename = filename.replace('.pdf', '_fallback.pdf');
      pdf.save(fallbackFilename);
      
      return {
        success: true,
        filename: fallbackFilename,
        isFallback: true
      };
    } catch (fallbackError) {
      console.error('Fallback PDF generation failed:', fallbackError);
      throw new Error('Complete PDF generation failure');
    }
  }
}

// Create singleton instance
export const pdfGenerator = new PDFGenerator();

// Export utility functions
export const generateFileName = (objSummary, selectedLocations, customPrefix) => {
  return pdfGenerator.generateFileName(objSummary, selectedLocations, customPrefix);
};

export const generatePDFFromElement = (element, objSummary, selectedLocations, options) => {
  return pdfGenerator.generatePDFFromElement(element, objSummary, selectedLocations, options);
};

export default PDFGenerator;