const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

const generateInvoice = async (order, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({ margin: 50 });
      
      // Pipe its output to the file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Add company logo (if available)
      doc.image('./public/images/bgremovedlogo.png', 50, 45, { width: 150 });


      // Add invoice title
      doc.fontSize(24).text('INVOICE', 300, 45, { align: 'right' });
      doc.moveDown(2);
      
      // Add order information with bold labels
      doc.fontSize(12);
      const startY = 120;
      
      doc.font('Helvetica-Bold').text('Invoice Date:', 50, startY);
      doc.font('Helvetica').text(new Date(order.createdAt).toLocaleDateString('en-GB'), 150, startY);
      
      doc.font('Helvetica-Bold').text('Order ID:', 50, startY + 20);
      doc.font('Helvetica').text(order.orderId, 150, startY + 20);
      
      doc.font('Helvetica-Bold').text('Order Date:', 300, startY + 20);
      doc.font('Helvetica').text(new Date(order.createdAt).toLocaleDateString('en-GB'), 380, startY + 20);
      
      doc.font('Helvetica-Bold').text('Payment Method:', 50, startY + 40);
      doc.font('Helvetica').text(order.paymentMethod, 150, startY + 40);
      
      doc.font('Helvetica-Bold').text('Payment Status:', 50, startY + 60);
      doc.font('Helvetica').text(order.paymentStatus, 150, startY + 60);
      
      // Add customer information
      doc.font('Helvetica-Bold').text('Customer Details:', 50, startY + 90);
      doc.font('Helvetica-Bold').text('Name:', 50, startY + 110);
      doc.font('Helvetica').text(order.deliveryAddress.name, 150, startY + 110);
      
      doc.font('Helvetica-Bold').text('Address:', 50, startY + 130);
      // Handle multiline address 
      const addressText = `${order.deliveryAddress.landMark}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}`;
      doc.font('Helvetica').text(addressText, 150, startY + 130, {
        width: 300,
        align: 'left'
      });
      
      // Get the height of the address text to properly position the phone number
      const addressHeight = doc.heightOfString(addressText, { width: 300 });
      const phoneY = startY + 130 + addressHeight + 10;
      
      doc.font('Helvetica-Bold').text('Phone:', 50, phoneY);
      doc.font('Helvetica').text(order.deliveryAddress.phone, 150, phoneY);
      
      // Add table headers
      const invoiceTableTop = phoneY + 50;
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, invoiceTableTop, { width: 250 });
      doc.text('Qty', 300, invoiceTableTop, { width: 50, align: 'center' });
      doc.text('Price', 350, invoiceTableTop, { width: 100, align: 'right' });
      doc.text('Amount', 450, invoiceTableTop, { width: 100, align: 'right' });
      
      // Draw a line
      doc.moveTo(50, invoiceTableTop + 20)
         .lineTo(550, invoiceTableTop + 20)
         .stroke();
      
      let tablePosition = invoiceTableTop + 30;
      
      // Add table rows for each item
      doc.font('Helvetica');
      order.orderedItems.forEach(item => {
        const productName = item.product.productName || 'Product';
        
        // Handle long product names with word wrap
        const textOptions = { 
          width: 230,
          align: 'left'
        };
        
        // Calculate height of wrapped text to determine spacing
        const textHeight = doc.heightOfString(productName, textOptions);
        const rowHeight = Math.max(textHeight, 25); // Minimum row height
        
        // Add more space if we're close to page end
        if (tablePosition + rowHeight > 700) {
          doc.addPage();
          tablePosition = 50;
        }
        
        // Product name with word wrap
        doc.text(productName, 50, tablePosition, textOptions);
        
        // Center quantity vertically
        doc.text(item.quantity.toString(), 300, tablePosition + (rowHeight/2) - 7, { 
          width: 50, 
          align: 'center' 
        });
        
        // Right-align price with ₹ symbol
        doc.text(`₹${item.price}`, 350, tablePosition + (rowHeight/2) - 7, { 
          width: 100, 
          align: 'right' 
        });
        
        // Right-align amount with ₹ symbol
        let amountText = `₹${item.price * item.quantity}`;
        if (item.cancelled) {
          amountText = 'Cancelled';
        } else if (item.returnStatus === 'Approved') {
          amountText = 'Returned';
        }
        
        doc.text(amountText, 450, tablePosition + (rowHeight/2) - 7, { 
          width: 100, 
          align: 'right' 
        });
        
        // Move to next row with appropriate spacing
        tablePosition += rowHeight + 15;
      });
      
      // Draw a line
      doc.moveTo(50, tablePosition)
         .lineTo(550, tablePosition)
         .stroke();
      
      // Add summary
      tablePosition += 20;
      doc.font('Helvetica-Bold').text('Subtotal:', 350, tablePosition, { width: 100, align: 'right' });
      doc.font('Helvetica').text(`₹${order.totalPrice}`, 450, tablePosition, { width: 100, align: 'right' });
      
      if (order.totalPrice !== order.finalAmount) {
        tablePosition += 20;
        doc.font('Helvetica-Bold').text('Discount:', 350, tablePosition, { width: 100, align: 'right' });
        doc.font('Helvetica').text(`₹${order.totalPrice - order.finalAmount}`, 450, tablePosition, { width: 100, align: 'right' });
      }
      
      tablePosition += 20;
      doc.font('Helvetica-Bold').text('Total:', 350, tablePosition, { width: 100, align: 'right' });
      doc.font('Helvetica').text(`₹${order.finalAmount}`, 450, tablePosition, { width: 100, align: 'right' });
      
      // Add footer
      doc.fontSize(10).font('Helvetica').text(
        'Thank you for shopping with Kidify!',
        50,
        700,
        { align: 'center', width: 500 }
      );
      
      // Finalize the PDF
      doc.end();
      
      // Handle stream events
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoice };