document.addEventListener('DOMContentLoaded', function() {
    // Load reports data
    initReports();
    
    // Set up event listeners
    setupReportEvents();
});

// Initialize reports
function initReports() {
    // Set default report type and date range
    const reportType = document.getElementById('reportType');
    if (reportType) {
        // Set default report type to Payroll Summary
        reportType.value = 'payroll';
        
        // Generate report based on default selection
        generateReport(reportType.value);
    }
}

// Set up event listeners for report actions
function setupReportEvents() {
    // Get report type select
    const reportType = document.getElementById('reportType');
    const dateRangeStart = document.getElementById('dateRangeStart');
    const dateRangeEnd = document.getElementById('dateRangeEnd');
    const generateReportBtn = document.getElementById('generateReportBtn');
    
    // Set default date range (current month)
    if (dateRangeStart && dateRangeEnd) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        dateRangeStart.valueAsDate = firstDay;
        dateRangeEnd.valueAsDate = lastDay;
    }
    
    // Report type change event
    if (reportType) {
        reportType.addEventListener('change', function() {
            generateReport(this.value);
        });
    }
    
    // Generate report button click event
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            const selectedReportType = reportType.value;
            generateReport(selectedReportType);
        });
    }
    
    // Print report button click event
    document.addEventListener('click', function(e) {
        if (e.target.id === 'printReportBtn') {
            window.print();
        }
    });
}

// Generate report based on selected type
function generateReport(reportType) {
    // Get report container
    const reportContainer = document.getElementById('reportContainer');
    if (!reportContainer) return;
    
    // Get date range
    const dateRangeStart = document.getElementById('dateRangeStart').value;
    const dateRangeEnd = document.getElementById('dateRangeEnd').value;
    
    // Clear container
    reportContainer.innerHTML = '';
    
    // Generate selected report
    switch (reportType) {
        case 'payroll':
            generatePayrollSummaryReport(reportContainer, dateRangeStart, dateRangeEnd);
            break;
        case 'attendance':
            generateAttendanceSummaryReport(reportContainer, dateRangeStart, dateRangeEnd);
            break;
        case 'department':
            generateDepartmentSummaryReport(reportContainer);
            break;
        case 'employee':
            generateEmployeeListReport(reportContainer);
            break;
        default:
            reportContainer.innerHTML = '<p>Please select a report type.</p>';
    }
}

// Generate Payroll Summary Report
function generatePayrollSummaryReport(container, startDate, endDate) {
    // Get payroll data
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Filter payroll records within date range
    const filteredPayroll = payroll.filter(p => {
        const payDate = new Date(p.payDate);
        return payDate >= new Date(startDate) && payDate <= new Date(endDate);
    });
    
    // Sort by pay date
    filteredPayroll.sort((a, b) => new Date(a.payDate) - new Date(b.payDate));
    
    // Create report HTML
    let reportHTML = `
        <div class="report">
            <div class="report-header">
                <div class="report-title">
                    <h2>Payroll Summary Report</h2>
                    <p>Period: ${formatDate(startDate)} to ${formatDate(endDate)}</p>
                </div>
                <button id="printReportBtn" class="btn btn-primary">Print Report</button>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Pay Date</th>
                            <th>Employee</th>
                            <th>Department</th>
                            <th>Gross Salary</th>
                            <th>Total Deductions</th>
                            <th>Net Salary</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Track totals
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    
    // Add rows for each payroll record
    filteredPayroll.forEach(record => {
        // Find employee
        const employee = employees.find(emp => emp.id === record.employeeId);
        
        if (employee) {
            reportHTML += `
                <tr>
                    <td>${formatDate(record.payDate)}</td>
                    <td>${employee.name}</td>
                    <td>${employee.department}</td>
                    <td>${formatCurrency(record.baseSalary)}</td>
                    <td>${formatCurrency(record.totalDeductions)}</td>
                    <td>${formatCurrency(record.netSalary)}</td>
                </tr>
            `;
            
            // Update totals
            totalGross += record.baseSalary;
            totalDeductions += record.totalDeductions;
            totalNet += record.netSalary;
        }
    });
    
    // Add summary row
    reportHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="3">Total</th>
                        <th>${formatCurrency(totalGross)}</th>
                        <th>${formatCurrency(totalDeductions)}</th>
                        <th>${formatCurrency(totalNet)}</th>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <div class="report-summary">
            <p><strong>Total Records:</strong> ${filteredPayroll.length}</p>
            <p><strong>Total Gross Salary:</strong> ${formatCurrency(totalGross)}</p>
            <p><strong>Total Deductions:</strong> ${formatCurrency(totalDeductions)}</p>
            <p><strong>Total Net Salary:</strong> ${formatCurrency(totalNet)}</p>
        </div>
    </div>
    `;
    
    // Set report HTML
    container.innerHTML = reportHTML;
}

// Generate Attendance Summary Report
function generateAttendanceSummaryReport(container, startDate, endDate) {
    // Get attendance data
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Filter attendance records within date range
    const filteredAttendance = attendance.filter(a => {
        return a.date >= startDate && a.date <= endDate;
    });
    
    // Group attendance by employee
    const attendanceByEmployee = {};
    
    employees.forEach(emp => {
        attendanceByEmployee[emp.id] = {
            employee: emp,
            present: 0,
            absent: 0,
            late: 0,
            records: []
        };
    });
    
    // Count attendance status for each employee
    filteredAttendance.forEach(record => {
        if (attendanceByEmployee[record.employeeId]) {
            if (record.status === 'Present') {
                attendanceByEmployee[record.employeeId].present++;
                
                // Check if late (after 8:30 AM)
                if (record.timeIn > '08:30') {
                    attendanceByEmployee[record.employeeId].late++;
                }
            } else if (record.status === 'Absent') {
                attendanceByEmployee[record.employeeId].absent++;
            }
            
            attendanceByEmployee[record.employeeId].records.push(record);
        }
    });
    
    // Calculate working days in date range (excluding weekends)
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        // Skip weekends (0 is Sunday, 6 is Saturday)
        if (day.getDay() !== 0 && day.getDay() !== 6) {
            workingDays++;
        }
    }
    
    // Create report HTML
    let reportHTML = `
        <div class="report">
            <div class="report-header">
                <div class="report-title">
                    <h2>Attendance Summary Report</h2>
                    <p>Period: ${formatDate(startDate)} to ${formatDate(endDate)}</p>
                    <p>Total Working Days: ${workingDays}</p>
                </div>
                <button id="printReportBtn" class="btn btn-primary">Print Report</button>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Department</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Late</th>
                            <th>Attendance Rate</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Add rows for each employee
    for (const empId in attendanceByEmployee) {
        const data = attendanceByEmployee[empId];
        const attendanceRate = (data.present / workingDays) * 100;
        
        reportHTML += `
            <tr>
                <td>${data.employee.name}</td>
                <td>${data.employee.department}</td>
                <td>${data.present}</td>
                <td>${workingDays - data.present}</td>
                <td>${data.late}</td>
                <td>${attendanceRate.toFixed(2)}%</td>
            </tr>
        `;
    }
    
    reportHTML += `
                </tbody>
            </table>
        </div>
        
        <div class="report-summary">
            <p><strong>Total Employees:</strong> ${Object.keys(attendanceByEmployee).length}</p>
            <p><strong>Period:</strong> ${formatDate(startDate)} to ${formatDate(endDate)}</p>
            <p><strong>Working Days:</strong> ${workingDays}</p>
        </div>
    </div>
    `;
    
    // Set report HTML
    container.innerHTML = reportHTML;
}

// Generate Department Summary Report
function generateDepartmentSummaryReport(container) {
    // Get department and employee data
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Group employees by department
    const empByDepartment = {};
    
    departments.forEach(dept => {
        empByDepartment[dept.name] = {
            department: dept,
            employees: [],
            count: 0,
            totalSalary: 0
        };
    });
    
    // Assign employees to departments
    employees.forEach(emp => {
        if (empByDepartment[emp.department]) {
            empByDepartment[emp.department].employees.push(emp);
            empByDepartment[emp.department].count++;
            empByDepartment[emp.department].totalSalary += emp.salary;
        }
    });
    
    // Create report HTML
    let reportHTML = `
        <div class="report">
            <div class="report-header">
                <div class="report-title">
                    <h2>Department Summary Report</h2>
                    <p>Total Departments: ${departments.length}</p>
                </div>
                <button id="printReportBtn" class="btn btn-primary">Print Report</button>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Description</th>
                            <th>Number of Employees</th>
                            <th>Total Salary Budget</th>
                            <th>Average Salary</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Track totals
    let totalEmployees = 0;
    let totalSalaryBudget = 0;
    
    // Add rows for each department
    departments.forEach(dept => {
        const data = empByDepartment[dept.name];
        const avgSalary = data.count > 0 ? data.totalSalary / data.count : 0;
        
        reportHTML += `
            <tr>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td>${data.count}</td>
                <td>${formatCurrency(data.totalSalary)}</td>
                <td>${formatCurrency(avgSalary)}</td>
            </tr>
        `;
        
        // Update totals
        totalEmployees += data.count;
        totalSalaryBudget += data.totalSalary;
    });
    
    // Calculate overall average salary
    const overallAvgSalary = totalEmployees > 0 ? totalSalaryBudget / totalEmployees : 0;
    
    // Add summary row
    reportHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="2">Total</th>
                        <th>${totalEmployees}</th>
                        <th>${formatCurrency(totalSalaryBudget)}</th>
                        <th>${formatCurrency(overallAvgSalary)}</th>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <div class="report-summary">
            <p><strong>Total Departments:</strong> ${departments.length}</p>
            <p><strong>Total Employees:</strong> ${totalEmployees}</p>
            <p><strong>Total Salary Budget:</strong> ${formatCurrency(totalSalaryBudget)}</p>
            <p><strong>Overall Average Salary:</strong> ${formatCurrency(overallAvgSalary)}</p>
        </div>
    </div>
    `;
    
    // Set report HTML
    container.innerHTML = reportHTML;
}

// Generate Employee List Report
function generateEmployeeListReport(container) {
    // Get employee data
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Sort employees by name
    const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name));
    
    // Create report HTML
    let reportHTML = `
        <div class="report">
            <div class="report-header">
                <div class="report-title">
                    <h2>Employee List Report</h2>
                    <p>Total Employees: ${employees.length}</p>
                </div>
                <button id="printReportBtn" class="btn btn-primary">Print Report</button>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Position</th>
                            <th>Department</th>
                            <th>Salary</th>
                            <th>Date Hired</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Track totals
    let totalSalary = 0;
    
    // Add rows for each employee
    sortedEmployees.forEach(emp => {
        reportHTML += `
            <tr>
                <td>${emp.name}</td>
                <td>${emp.email}</td>
                <td>${emp.position}</td>
                <td>${emp.department}</td>
                <td>${formatCurrency(emp.salary)}</td>
                <td>${formatDate(emp.dateHired)}</td>
            </tr>
        `;
        
        // Update totals
        totalSalary += emp.salary;
    });
    
    // Calculate average salary
    const avgSalary = employees.length > 0 ? totalSalary / employees.length : 0;
    
    // Add summary row
    reportHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="4">Total</th>
                        <th>${formatCurrency(totalSalary)}</th>
                        <th></th>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <div class="report-summary">
            <p><strong>Total Employees:</strong> ${employees.length}</p>
            <p><strong>Total Salary:</strong> ${formatCurrency(totalSalary)}</p>
            <p><strong>Average Salary:</strong> ${formatCurrency(avgSalary)}</p>
        </div>
    </div>
    `;
    
    // Set report HTML
    container.innerHTML = reportHTML;
}