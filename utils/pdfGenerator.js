const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a paystub PDF
 * @param {Object} payrollItem - Payroll item with employee and payment details
 * @param {Object} periodData - Pay period information
 * @param {Object} options - PDF generation options
 * @returns {Buffer} PDF document as buffer
 */
const generatePaystubPDF = async (payrollItem, periodData, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50
      });
      
      // Collect the PDF data in memory
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add company header
      doc.fontSize(20).font('Helvetica-Bold').text('MSA Payroll System', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Antigua Payroll Services', { align: 'center' });
      doc.moveDown();
      
      // Add period information
      doc.fontSize(16).font('Helvetica-Bold').text('PAYSTUB', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`Pay Period: ${periodData.periodStart} to ${periodData.periodEnd}`, { align: 'center' });
      doc.fontSize(10).text(`Pay Date: ${periodData.payDate}`, { align: 'center' });
      doc.moveDown();
      
      // Add employee information
      doc.fontSize(12).font('Helvetica-Bold').text('Employee Information');
      doc.fontSize(10).font('Helvetica');
      const employeeName = payrollItem.employeeName || payrollItem.employee_name || 'Unknown Employee';
      const employeeId = payrollItem.employeeId || payrollItem.employee_id || payrollItem.employee_number;
      doc.text(`Name: ${employeeName}`);
      doc.text(`Employee ID: ${employeeId || 'N/A'}`);
      doc.moveDown();
      
      // Add earnings section
      doc.fontSize(12).font('Helvetica-Bold').text('Earnings');
      doc.moveDown(0.5);
      
      // Create a table-like structure for earnings
      const tableWidth = 500;
      const colWidth = tableWidth / 3;
      
      // Table header
      doc.font('Helvetica-Bold')
        .text('Description', 50, doc.y, { width: colWidth, align: 'left' })
        .text('Hours', 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
        .text('Amount', 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Add horizontal line
      doc.moveTo(50, doc.y + 5)
        .lineTo(550, doc.y + 5)
        .stroke();
      doc.moveDown(0.5);
      
      // Regular earnings
      // Handle both camelCase and snake_case property names
      const hoursWorked = payrollItem.hoursWorked || payrollItem.hours_worked || 0;
      
      // Log data for debugging
      console.log('PDF Generation - Payroll Item:', {
        employeeName: payrollItem.employee_name || payrollItem.employeeName,
        employeeId: payrollItem.employeeId || payrollItem.employee_id || payrollItem.employee_number,
        grossPay: payrollItem.grossPay || payrollItem.gross_pay,
        hoursWorked: hoursWorked,
        loanDeduction: payrollItem.loanDeduction || payrollItem.loan_deduction,
        hasLoanDetails: options.loanDetails ? true : false
      });
      
      const grossPay = parseFloat(payrollItem.grossPay || payrollItem.gross_pay || 0).toFixed(2);
      
      doc.font('Helvetica')
        .text('Regular Earnings', 50, doc.y, { width: colWidth, align: 'left' })
        .text(hoursWorked.toString(), 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
        .text(`$${grossPay}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Add horizontal line
      doc.moveDown();
      doc.moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);
      
      // Gross pay total
      doc.font('Helvetica-Bold')
        .text('Gross Pay', 50, doc.y, { width: colWidth, align: 'left' })
        .text('', 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
        .text(`$${grossPay}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      doc.moveDown(1.5);
      
      // Add deductions section
      doc.fontSize(12).font('Helvetica-Bold').text('Deductions');
      doc.moveDown(0.5);
      
      // Table header for deductions
      doc.font('Helvetica-Bold')
        .text('Description', 50, doc.y, { width: colWidth * 2, align: 'left' })
        .text('Amount', 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Add horizontal line
      doc.moveTo(50, doc.y + 5)
        .lineTo(550, doc.y + 5)
        .stroke();
      doc.moveDown(0.5);
      
      // Handle both camelCase and snake_case property names for deductions
      const socialSecurityEmployee = parseFloat(payrollItem.socialSecurityEmployee || payrollItem.social_security_employee || 0).toFixed(2);
      const medicalBenefitsEmployee = parseFloat(payrollItem.medicalBenefitsEmployee || payrollItem.medical_benefits_employee || 0).toFixed(2);
      const educationLevy = parseFloat(payrollItem.educationLevy || payrollItem.education_levy || 0).toFixed(2);
      const loanDeduction = parseFloat(payrollItem.loanDeduction || payrollItem.loan_deduction || 0).toFixed(2);
      
      // Social Security
      doc.font('Helvetica')
        .text('Social Security (7%)', 50, doc.y, { width: colWidth * 2, align: 'left' })
        .text(`$${socialSecurityEmployee}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Medical Benefits
      doc.font('Helvetica')
        .text('Medical Benefits', 50, doc.y, { width: colWidth * 2, align: 'left' })
        .text(`$${medicalBenefitsEmployee}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Education Levy
      doc.font('Helvetica')
        .text('Education Levy', 50, doc.y, { width: colWidth * 2, align: 'left' })
        .text(`$${educationLevy}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Employee Loan Deduction
      if (parseFloat(loanDeduction) > 0) {
        doc.font('Helvetica')
          .text('Employee Loan Repayment', 50, doc.y, { width: colWidth * 2, align: 'left' })
          .text(`$${loanDeduction}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      }
      
      // Add horizontal line
      doc.moveDown();
      doc.moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);
      
      // Total deductions
      const totalDeductions = parseFloat(socialSecurityEmployee) + parseFloat(medicalBenefitsEmployee) + 
        parseFloat(educationLevy) + parseFloat(loanDeduction);
      doc.font('Helvetica-Bold')
        .text('Total Deductions', 50, doc.y, { width: colWidth * 2, align: 'left' })
        .text(`$${totalDeductions.toFixed(2)}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      doc.moveDown(1.5);
      
      // Net pay
      const netPay = parseFloat(payrollItem.netPay || payrollItem.net_pay || 0).toFixed(2);
      doc.font('Helvetica-Bold')
        .text('Net Pay', 50, doc.y, { width: colWidth * 2, align: 'left' })
        .text(`$${netPay}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Add employer contributions section
      doc.moveDown(1.5);
      doc.fontSize(12).font('Helvetica-Bold').text('Employer Contributions');
      doc.moveDown(0.5);
      
      // Table header for employer contributions
      doc.font('Helvetica-Bold')
        .text('Description', 50, doc.y, { width: colWidth * 2, align: 'left' })
        .text('Amount', 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Add horizontal line
      doc.moveTo(50, doc.y + 5)
        .lineTo(550, doc.y + 5)
        .stroke();
      doc.moveDown(0.5);
      
      // Handle both camelCase and snake_case property names for employer contributions
      const socialSecurityEmployer = parseFloat(payrollItem.socialSecurityEmployer || payrollItem.social_security_employer || 0).toFixed(2);
      const medicalBenefitsEmployer = parseFloat(payrollItem.medicalBenefitsEmployer || payrollItem.medical_benefits_employer || 0).toFixed(2);
      
      // Employer Social Security
      doc.font('Helvetica')
        .text('Social Security (9%)', 50, doc.y, { width: colWidth * 2, align: 'left' })
        .text(`$${socialSecurityEmployer}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Employer Medical Benefits
      doc.font('Helvetica')
        .text('Medical Benefits', 50, doc.y, { width: colWidth * 2, align: 'left' })
        .text(`$${medicalBenefitsEmployer}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Add horizontal line
      doc.moveDown();
      doc.moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);
      
      // Total employer contributions
      const totalEmployerContributions = parseFloat(socialSecurityEmployer) + parseFloat(medicalBenefitsEmployer);
      doc.font('Helvetica-Bold')
        .text('Total Employer Contributions', 50, doc.y, { width: colWidth * 2, align: 'left' })
        .text(`$${totalEmployerContributions.toFixed(2)}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Add Employee Loan Breakdown if applicable
      if (parseFloat(loanDeduction) > 0) {
        doc.moveDown(1.5);
        doc.fontSize(12).font('Helvetica-Bold').text('Employee Loan Breakdown');
        doc.moveDown(0.5);
        
        // First check if we have detailed loan information
        if (options.loanDetails) {
          // Ensure all values are properly handled to avoid null reference errors
          const loan = options.loanDetails;
          
          console.log(`Rendering loan details: ${JSON.stringify(loan)}`);
          
          doc.font('Helvetica').fontSize(10);
          
          // Safely parse and format loan values
          const loanAmount = loan.loan_amount ? parseFloat(loan.loan_amount).toFixed(2) : '0.00';
          const interestRate = loan.interest_rate ? parseFloat(loan.interest_rate).toFixed(2) : '0.00';
          const totalAmount = loan.total_amount ? parseFloat(loan.total_amount).toFixed(2) : '0.00';
          const remainingAmount = loan.remaining_amount ? parseFloat(loan.remaining_amount).toFixed(2) : '0.00';
          const installmentAmount = loan.installment_amount ? parseFloat(loan.installment_amount).toFixed(2) : '0.00';
          
          doc.text(`Original Loan Amount: $${loanAmount}`, 50, doc.y);
          doc.text(`Interest Rate: ${interestRate}%`, 50, doc.y);
          doc.text(`Total Amount with Interest: $${totalAmount}`, 50, doc.y);
          doc.text(`Remaining Balance: $${remainingAmount}`, 50, doc.y);
          doc.text(`Payment Amount: $${installmentAmount} per pay period`, 50, doc.y);
          
          if (loan.start_date) {
            const startDate = new Date(loan.start_date);
            doc.text(`Loan Start Date: ${startDate.toLocaleDateString()}`, 50, doc.y);
          }
          
          if (loan.expected_end_date) {
            const endDate = new Date(loan.expected_end_date);
            doc.text(`Expected End Date: ${endDate.toLocaleDateString()}`, 50, doc.y);
          }
        } else {
          // If we don't have detailed loan information, just show the current deduction
          doc.font('Helvetica').fontSize(10);
          doc.text(`Current Loan Deduction: $${loanDeduction}`, 50, doc.y);
          doc.text(`No detailed loan information available.`, 50, doc.y);
        }
        
        doc.moveDown();
        doc.fontSize(9).font('Helvetica-Oblique')
          .text('Note: An employee loan or payroll deduction loan is money lent by employers to someone who works for them. It\'s like a personal loan, except the interest rates are usually less than what a bank might offer.', {
            width: 500,
            align: 'left'
          });
      }
      
      // Add YTD Information Section
      doc.moveDown(2);
      doc.fontSize(12).font('Helvetica-Bold').text('Year-To-Date Summary');
      doc.moveDown(0.5);
      
      // YTD Table header
      doc.font('Helvetica-Bold')
        .text('Description', 50, doc.y, { width: colWidth, align: 'left' })
        .text('Current Period', 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
        .text('Year-To-Date', 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Add horizontal line
      doc.moveTo(50, doc.y + 5)
        .lineTo(550, doc.y + 5)
        .stroke();
      doc.moveDown(0.5);
      
      // YTD data handling (both camelCase and snake_case)
      const ytdGrossPay = parseFloat(payrollItem.ytdGrossPay || payrollItem.ytd_gross_pay || 0).toFixed(2);
      const ytdSocialSecurityEmployee = parseFloat(payrollItem.ytdSocialSecurityEmployee || payrollItem.ytd_social_security_employee || 0).toFixed(2);
      const ytdMedicalBenefitsEmployee = parseFloat(payrollItem.ytdMedicalBenefitsEmployee || payrollItem.ytd_medical_benefits_employee || 0).toFixed(2);
      const ytdEducationLevy = parseFloat(payrollItem.ytdEducationLevy || payrollItem.ytd_education_levy || 0).toFixed(2);
      const ytdLoanDeduction = parseFloat(payrollItem.ytdLoanDeduction || payrollItem.ytd_loan_deduction || 0).toFixed(2);
      const ytdNetPay = parseFloat(payrollItem.ytdNetPay || payrollItem.ytd_net_pay || 0).toFixed(2);
      const ytdHoursWorked = parseFloat(payrollItem.ytdHoursWorked || payrollItem.ytd_hours_worked || 0).toFixed(2);
      
      // Gross Pay YTD
      doc.font('Helvetica')
        .text('Gross Pay', 50, doc.y, { width: colWidth, align: 'left' })
        .text(`$${grossPay}`, 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
        .text(`$${ytdGrossPay}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Social Security YTD
      doc.font('Helvetica')
        .text('Social Security', 50, doc.y, { width: colWidth, align: 'left' })
        .text(`$${socialSecurityEmployee}`, 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
        .text(`$${ytdSocialSecurityEmployee}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Medical Benefits YTD
      doc.font('Helvetica')
        .text('Medical Benefits', 50, doc.y, { width: colWidth, align: 'left' })
        .text(`$${medicalBenefitsEmployee}`, 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
        .text(`$${ytdMedicalBenefitsEmployee}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Education Levy YTD
      doc.font('Helvetica')
        .text('Education Levy', 50, doc.y, { width: colWidth, align: 'left' })
        .text(`$${educationLevy}`, 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
        .text(`$${ytdEducationLevy}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Loan Deduction YTD (if applicable)
      if (parseFloat(loanDeduction) > 0 || parseFloat(ytdLoanDeduction) > 0) {
        doc.font('Helvetica')
          .text('Loan Repayment', 50, doc.y, { width: colWidth, align: 'left' })
          .text(`$${loanDeduction}`, 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
          .text(`$${ytdLoanDeduction}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      }
      
      // Hours Worked YTD
      doc.font('Helvetica')
        .text('Hours Worked', 50, doc.y, { width: colWidth, align: 'left' })
        .text(hoursWorked.toString(), 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
        .text(ytdHoursWorked, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });
      
      // Add horizontal line
      doc.moveDown();
      doc.moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);
      
      // Net Pay YTD (bold)
      doc.font('Helvetica-Bold')
        .text('Net Pay', 50, doc.y, { width: colWidth, align: 'left' })
        .text(`$${netPay}`, 50 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' })
        .text(`$${ytdNetPay}`, 50 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth, align: 'right' });

      // Add Vacation Entitlement Section
      if (payrollItem.vacation_balance !== undefined || payrollItem.annual_pto_hours !== undefined) {
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica-Bold').text('Vacation Entitlement');
        doc.moveDown(0.5);
        
        const vacationBalance = parseFloat(payrollItem.vacation_balance || 0).toFixed(2);
        const annualPtoHours = parseFloat(payrollItem.annual_pto_hours || 0).toFixed(2);
        const accrualRate = parseFloat(payrollItem.accrual_rate_per_hour || 0).toFixed(6);
        
        doc.font('Helvetica')
          .text(`Annual PTO Allocation: ${annualPtoHours} hours`, 50, doc.y)
          .text(`Current Vacation Balance: ${vacationBalance} hours`, 50, doc.y)
          .text(`Accrual Rate: ${accrualRate} hours per hour worked`, 50, doc.y);
      }

      // Add footer
      doc.fontSize(8).font('Helvetica')
        .text('This is an electronic paystub and does not require a signature.', 50, 700);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 50);
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePaystubPDF };
