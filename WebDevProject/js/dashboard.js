document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard data
    loadDashboardData();
    
    // Initialize charts
    initCharts();
});

// Load dashboard data from localStorage
function loadDashboardData() {
    // Get data from localStorage
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    
    // Update statistics
    updateStats(employees, departments, attendance, payroll);
    
    // Load recent employees
    loadRecentEmployees(employees);
    
    // Load upcoming paydays
    loadUpcomingPaydays(payroll);
}

// Update statistics cards
function updateStats(employees, departments, attendance, payroll) {
    // Update total employees
    const totalEmployeesElement = document.getElementById('totalEmployees');
    if (totalEmployeesElement) {
        totalEmployeesElement.textContent = employees.length;
    }
    
    // Update total departments
    const totalDepartmentsElement = document.getElementById('totalDepartments');
    if (totalDepartmentsElement) {
        totalDepartmentsElement.textContent = departments.length;
    }
    
    // Calculate attendance statistics
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);
    
    const totalPresentElement = document.getElementById('totalPresent');
    if (totalPresentElement) {
        totalPresentElement.textContent = todayAttendance.length;
    }
    
    // Calculate next payday
    const currentDate = new Date();
    let nextPayday = null;
    
    payroll.forEach(pay => {
        const payDate = new Date(pay.payDate);
        if (payDate > currentDate) {
            if (!nextPayday || payDate < nextPayday) {
                nextPayday = payDate;
            }
        }
    });
    
    const nextPaydayElement = document.getElementById('nextPayday');
    if (nextPaydayElement) {
        if (nextPayday) {
            nextPaydayElement.textContent = formatDate(nextPayday);
        } else {
            nextPaydayElement.textContent = 'Not scheduled';
        }
    }
}

// Load recent employees
function loadRecentEmployees(employees) {
    const recentEmployeesTable = document.getElementById('recentEmployeesTable');
    if (!recentEmployeesTable) return;
    
    // Sort employees by date hired (descending)
    const sortedEmployees = [...employees].sort((a, b) => {
        return new Date(b.dateHired) - new Date(a.dateHired);
    });
    
    // Get the 5 most recent employees
    const recentEmployees = sortedEmployees.slice(0, 5);
    
    // Clear existing table rows
    recentEmployeesTable.innerHTML = '';
    
    // Add table header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Name</th>
        <th>Position</th>
        <th>Department</th>
        <th>Date Hired</th>
    `;
    recentEmployeesTable.appendChild(headerRow);
    
    // Add table rows for each recent employee
    recentEmployees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.position}</td>
            <td>${employee.department}</td>
            <td>${formatDate(employee.dateHired)}</td>
        `;
        recentEmployeesTable.appendChild(row);
    });
}

// Load upcoming paydays
function loadUpcomingPaydays(payroll) {
    const upcomingPaydaysTable = document.getElementById('upcomingPaydaysTable');
    if (!upcomingPaydaysTable) return;
    
    // Get current date
    const currentDate = new Date();
    
    // Filter and sort upcoming paydays
    const upcomingPaydays = payroll
        .filter(pay => new Date(pay.payDate) > currentDate)
        .sort((a, b) => new Date(a.payDate) - new Date(b.payDate));
    
    // Get unique pay dates
    const uniquePayDates = [];
    const seenDates = new Set();
    
    upcomingPaydays.forEach(pay => {
        if (!seenDates.has(pay.payDate)) {
            seenDates.add(pay.payDate);
            uniquePayDates.push({
                payDate: pay.payDate,
                payPeriod: pay.payPeriod
            });
        }
    });
    
    // Get the 5 nearest unique pay dates
    const nearestPaydays = uniquePayDates.slice(0, 5);
    
    // Clear existing table rows
    upcomingPaydaysTable.innerHTML = '';
    
    // Add table header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Pay Period</th>
        <th>Pay Date</th>
        <th>Days Remaining</th>
    `;
    upcomingPaydaysTable.appendChild(headerRow);
    
    // Add table rows for each upcoming payday
    nearestPaydays.forEach(payday => {
        const payDate = new Date(payday.payDate);
        const daysRemaining = Math.ceil((payDate - currentDate) / (1000 * 60 * 60 * 24));
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payday.payPeriod}</td>
            <td>${formatDate(payday.payDate)}</td>
            <td>${daysRemaining} days</td>
        `;
        upcomingPaydaysTable.appendChild(row);
    });
}

// Initialize charts
function initCharts() {
    initDepartmentDistributionChart();
    initSalaryDistributionChart();
}

// Initialize department distribution chart
function initDepartmentDistributionChart() {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;
    
    // Get employees and departments
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    // Count employees by department
    const departmentCounts = {};
    departments.forEach(dept => {
        departmentCounts[dept.name] = 0;
    });
    
    employees.forEach(emp => {
        if (departmentCounts.hasOwnProperty(emp.department)) {
            departmentCounts[emp.department]++;
        }
    });
    
    // Prepare data for chart
    const departmentLabels = Object.keys(departmentCounts);
    const departmentData = Object.values(departmentCounts);
    const backgroundColors = [
        '#4CAF50', '#FFC107', '#2196F3', '#9C27B0', '#F44336', '#FF9800'
    ];
    
    // Create chart
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: departmentLabels,
            datasets: [{
                data: departmentData,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Employee Distribution by Department'
                }
            }
        }
    });
}

// Initialize salary distribution chart
function initSalaryDistributionChart() {
    const ctx = document.getElementById('salaryChart');
    if (!ctx) return;
    
    // Get employees
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Define salary ranges
    const salaryRanges = [
        { min: 0, max: 20000, label: '0-20K' },
        { min: 20000, max: 30000, label: '20K-30K' },
        { min: 30000, max: 40000, label: '30K-40K' },
        { min: 40000, max: 50000, label: '40K-50K' },
        { min: 50000, max: Infinity, label: '50K+' }
    ];
    
    // Count employees in each salary range
    const salaryCounts = Array(salaryRanges.length).fill(0);
    
    employees.forEach(emp => {
        const salary = emp.salary;
        for (let i = 0; i < salaryRanges.length; i++) {
            if (salary >= salaryRanges[i].min && salary < salaryRanges[i].max) {
                salaryCounts[i]++;
                break;
            }
        }
    });
    
    // Prepare data for chart
    const salaryLabels = salaryRanges.map(range => range.label);
    
    // Create chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: salaryLabels,
            datasets: [{
                label: 'Number of Employees',
                data: salaryCounts,
                backgroundColor: 'rgba(218, 165, 32, 0.7)',
                borderColor: 'rgba(218, 165, 32, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Employees'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Salary Range (PHP)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Employee Salary Distribution'
                }
            }
        }
    });
}
