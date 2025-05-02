const ExcelJS = require('exceljs');

/**
 * Generate a sales report in Excel format based on the provided orders and stats
 * @param {Array} orders - Array of order objects
 * @param {Object} stats - Object containing sales statistics
 * @param {Object} filter - Filter parameters used for the report
 * @returns {Promise<Buffer>} - Returns a promise that resolves to the Excel buffer
 */
const generateSalesReportExcel = async (orders, stats, filter) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = 'E-commerce Admin';
    workbook.lastModifiedBy = 'Sales Report System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Add a worksheet for the sales summary
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Add title and styling
    summarySheet.mergeCells('A1:G1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'Sales Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    
    // Add generation date
    summarySheet.mergeCells('A2:G2');
    const dateCell = summarySheet.getCell('A2');
    dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
    dateCell.alignment = { horizontal: 'right' };
    
    // Add filter information
    summarySheet.mergeCells('A4:B4');
    summarySheet.getCell('A4').value = 'Filter Applied:';
    summarySheet.getCell('A4').font = { bold: true };
    
    let rowIndex = 5;
    if (filter.payment) {
      summarySheet.getCell(`A${rowIndex}`).value = 'Payment Method:';
      summarySheet.getCell(`B${rowIndex}`).value = filter.payment;
      rowIndex++;
    }
    
    if (filter.dateFilter) {
      summarySheet.getCell(`A${rowIndex}`).value = 'Date Range:';
      summarySheet.getCell(`B${rowIndex}`).value = filter.dateFilter;
      rowIndex++;
      
      if (filter.dateFilter === 'custom' && filter.startDate && filter.endDate) {
        summarySheet.getCell(`A${rowIndex}`).value = 'Custom Period:';
        summarySheet.getCell(`B${rowIndex}`).value = `From ${new Date(filter.startDate).toLocaleDateString()} to ${new Date(filter.endDate).toLocaleDateString()}`;
        rowIndex++;
      }
    }
    
    // Add statistics
    rowIndex += 2;
    summarySheet.getCell(`A${rowIndex}`).value = 'Sales Summary';
    summarySheet.getCell(`A${rowIndex}`).font = { size: 12, bold: true, underline: true };
    rowIndex++;
    
    // Sales stats
    const statsData = [
      { label: 'Total Orders', value: stats.totalOrders },
      { label: 'Total Amount', value: `₹ ${stats.totalAmount.toFixed(0)}` },
      { label: 'Total Discounts', value: `₹ ${stats.totalDiscounts.toFixed(0)}` },
      { label: 'Net Sales', value: `₹ ${stats.netSales.toFixed(0)}` }
    ];
    
    statsData.forEach(stat => {
      summarySheet.getCell(`A${rowIndex}`).value = stat.label;
      summarySheet.getCell(`B${rowIndex}`).value = stat.value;
      rowIndex++;
    });
    
    // Add detailed orders in another worksheet
    const ordersSheet = workbook.addWorksheet('Order Details');
    
    // Set column headers and widths
    ordersSheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Order Date', key: 'date', width: 15 },
      { header: 'Items', key: 'items', width: 10 },
      { header: 'Total (₹)', key: 'total', width: 15 },
      { header: 'Discount (₹)', key: 'discount', width: 15 },
      { header: 'Payment Method', key: 'payment', width: 15 }
    ];
    
    // Style the header row
    ordersSheet.getRow(1).font = { bold: true };
    ordersSheet.getRow(1).alignment = { horizontal: 'center' };
    
    // Add data rows
    orders.forEach(order => {
      // Calculate total items
      let itemCount = 0;
      order.orderedItems.forEach(item => {
        itemCount += item.quantity;
      });
      
      // Calculate discount
      const discount = order.totalPrice - order.finalAmount;
      
      // Add row
      ordersSheet.addRow({
        orderId: `#${order.orderId}`,
        customer: order.deliveryAddress.name,
        date: new Date(order.createdAt).toLocaleDateString(),
        items: itemCount,
        total: order.totalPrice,
        discount: discount.toFixed(0),
        payment: order.paymentMethod
      });
    });
    
    // Format number columns
    ordersSheet.getColumn('total').numFmt = '₹#,##0';
    ordersSheet.getColumn('discount').numFmt = '₹#,##0';
    
    // Add totals row
    const totalRow = ordersSheet.addRow({
      orderId: '',
      customer: 'TOTAL',
      date: '',
      items: '',
      total: stats.totalAmount,
      discount: stats.totalDiscounts,
      payment: ''
    });
    
    totalRow.font = { bold: true };
    
    // Generate Excel buffer
    return await workbook.xlsx.writeBuffer();
    
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateSalesReportExcel
};