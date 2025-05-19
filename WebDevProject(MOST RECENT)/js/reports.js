document.addEventListener('DOMContentLoaded', function() {
    initReports();
    
    setupReportEvents();
});

function initReports() {

    const reportType = document.getElementById('reportType');
    if (reportType) {
        reportType.value = 'payroll';
        
        generateReport(reportType.value);
    }
}

function setupReportEvents() {
    const reportType = document.getElementById('reportType');
    const dateRangeStart = document.getElementById('dateRangeStart');
    const dateRangeEnd = document.getElementById('dateRangeEnd');
    const generateReportBtn = document.getElementById('generateReportBtn');
    
    if (dateRangeStart && dateRangeEnd) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        dateRangeStart.valueAsDate = firstDay;
        dateRangeEnd.valueAsDate = lastDay;
    }
    
    if (reportType) {
        reportType.addEventListener('change', function() {
            generateReport(this.value);
        });
    }
    
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            const selectedReportType = reportType.value;
            generateReport(selectedReportType);
        });
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.id === 'printReportBtn') {
            window.print();
        }
    });
}

function generateReport(reportType) {
    const reportContainer = document.getElementById('reportContainer');
    if (!reportContainer) return;
    
    const dateRangeStart = document.getElementById('dateRangeStart').value;
    const dateRangeEnd = document.getElementById('dateRangeEnd').value;
    reportContainer.innerHTML = '';
    
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

function generatePayrollSummaryReport(container, startDate, endDate) {
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    const employees = JSON.parse(localStorage.getItem('employees')) || [];

    const filteredPayroll = payroll.filter(p => {
        const payDate = new Date(p.payDate);
        return payDate >= new Date(startDate) && payDate <= new Date(endDate);
    });

    filteredPayroll.sort((a, b) => new Date(a.payDate) - new Date(b.payDate));
    

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
    
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    
    filteredPayroll.forEach(record => {
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

            totalGross += record.baseSalary;
            totalDeductions += record.totalDeductions;
            totalNet += record.netSalary;
        }
    });

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

    container.innerHTML = reportHTML;
}

function generateAttendanceSummaryReport(container, startDate, endDate) {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const filteredAttendance = attendance.filter(a => {
        return a.date >= startDate && a.date <= endDate;
    });

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

    filteredAttendance.forEach(record => {
        if (attendanceByEmployee[record.employeeId]) {
            if (record.status === 'Present') {
                attendanceByEmployee[record.employeeId].present++;

                if (record.timeIn > '08:30') {
                    attendanceByEmployee[record.employeeId].late++;
                }
            } else if (record.status === 'Absent') {
                attendanceByEmployee[record.employeeId].absent++;
            }
            
            attendanceByEmployee[record.employeeId].records.push(record);
        }
    });
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        if (day.getDay() !== 0 && day.getDay() !== 6) {
            workingDays++;
        }
    }

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
    
    container.innerHTML = reportHTML;
}

function generateDepartmentSummaryReport(container) {
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const empByDepartment = {};
    
    departments.forEach(dept => {
        empByDepartment[dept.name] = {
            department: dept,
            employees: [],
            count: 0,
            totalSalary: 0
        };
    });

    employees.forEach(emp => {
        if (empByDepartment[emp.department]) {
            empByDepartment[emp.department].employees.push(emp);
            empByDepartment[emp.department].count++;
            empByDepartment[emp.department].totalSalary += emp.salary;
        }
    });

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
    
    let totalEmployees = 0;
    let totalSalaryBudget = 0;

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

        totalEmployees += data.count;
        totalSalaryBudget += data.totalSalary;
    });

    const overallAvgSalary = totalEmployees > 0 ? totalSalaryBudget / totalEmployees : 0;

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

    container.innerHTML = reportHTML;
}

function generateEmployeeListReport(container) {
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name));

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

    let totalSalary = 0;

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

        totalSalary += emp.salary;
    });

    const avgSalary = employees.length > 0 ? totalSalary / employees.length : 0;

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
    

    container.innerHTML = reportHTML;
}
