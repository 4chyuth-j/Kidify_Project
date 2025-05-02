const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a sales report PDF based on the provided orders and stats
 * @param {Array} orders - Array of order objects
 * @param {Object} stats - Object containing sales statistics
 * @param {Object} filter - Filter parameters used for the report
 * @returns {Promise<Buffer>} - Returns a promise that resolves to the PDF buffer
 */
const generateSalesReportPDF = (orders, stats, filter) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Buffer to store PDF
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add company logo or title
      doc.fontSize(20).font('Helvetica-Bold').text('Sales Report', { align: 'center' });
      doc.moveDown();

      // Add report generated date
      doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();

      // Add filter information
      doc.fontSize(12).font('Helvetica-Bold').text('Filter Applied:');
      doc.fontSize(10).font('Helvetica');
      if (filter.payment) {
        doc.text(`Payment Method: ${filter.payment}`);
      }
      
      if (filter.dateFilter) {
        doc.text(`Date Range: ${filter.dateFilter}`);
        if (filter.dateFilter === 'custom' && filter.startDate && filter.endDate) {
          doc.text(`From ${new Date(filter.startDate).toLocaleDateString()} to ${new Date(filter.endDate).toLocaleDateString()}`);
        }
      }
      doc.moveDown(2);

      // Add statistics section
      doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
      doc.moveDown(0.5);
      
      // Create statistics table
      const statsData = [
        ['Total Orders', stats.totalOrders],
        ['Total Amount', `₹ ${stats.totalAmount.toFixed(0)}`],
        ['Total Discounts', `₹ ${stats.totalDiscounts.toFixed(0)}`],
        ['Net Sales', `₹ ${stats.netSales.toFixed(0)}`]
      ];
      
      // Format and display stats
      doc.fontSize(10).font('Helvetica');
      statsData.forEach(row => {
        doc.text(`${row[0]}: ${row[1]}`, { continued: false });
      });
      
      doc.moveDown(2);

      // Orders table headers
      doc.fontSize(14).font('Helvetica-Bold').text('Order Details', { underline: true });
      doc.moveDown(0.5);
      
      // Table headers
      const tableHeaders = ['Order ID', 'Customer', 'Date', 'Items', 'Total (₹)', 'Discount (₹)', 'Payment'];
      const tableTop = doc.y;
      const tableLeft = 50;
      
      // Column widths
      const colWidths = [80, 100, 80, 40, 70, 70, 60];
      let currentLeft = tableLeft;
      
      // Draw table header
      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, currentLeft, tableTop);
        currentLeft += colWidths[i];
      });
      
      // Draw horizontal line below headers
      doc.moveTo(tableLeft, tableTop + 15)
         .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
         .stroke();
      
      // Table rows
      doc.fontSize(9).font('Helvetica');
      let rowTop = tableTop + 25;
      
      orders.forEach((order, index) => {
        // Calculate row height
        const rowHeight = 20;
        
        // Check if we need a new page
        if (rowTop + rowHeight > doc.page.height - 50) {
          doc.addPage();
          rowTop = 50;
          
          // Redraw table header on new page
          currentLeft = tableLeft;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, currentLeft, rowTop);
            currentLeft += colWidths[i];
          });
          
          doc.moveTo(tableLeft, rowTop + 15)
             .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), rowTop + 15)
             .stroke();
          
          rowTop += 25;
          doc.fontSize(9).font('Helvetica');
        }
        
        // Calculate total items
        let itemCount = 0;
        order.orderedItems.forEach(item => {
          itemCount += item.quantity;
        });
        
        // Calculate discount
        const discount = order.totalPrice - order.finalAmount;
        
        // Order data array
        const rowData = [
          `#${order.orderId}`,
          order.deliveryAddress.name,
          new Date(order.createdAt).toLocaleDateString(),
          itemCount.toString(),
          order.totalPrice.toString(),
          discount.toFixed(0),
          order.paymentMethod
        ];
        
        // Draw row
        currentLeft = tableLeft;
        rowData.forEach((cell, i) => {
          doc.text(cell, currentLeft, rowTop);
          currentLeft += colWidths[i];
        });
        
        // Add separator line
        if (index !== orders.length - 1) {
          doc.moveTo(tableLeft, rowTop + rowHeight - 5)
             .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), rowTop + rowHeight - 5)
             .stroke({ opacity: 0.2 });
        }
        
        rowTop += rowHeight;
      });
      
      // Add footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Add page number at the bottom
        doc.fontSize(8)
           .text(
             `Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
      }
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateSalesReportPDF
};