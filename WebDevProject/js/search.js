document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
});

function initializeSearch() {
    const searchInput = document.querySelector('.search-container input');
    if (!searchInput) return;
    
    // Set placeholder based on current page
    const currentPage = getCurrentPage();
    updateSearchPlaceholder(searchInput, currentPage);
    
    // Add event listener for search input
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        // Perform search based on current page
        switch(currentPage) {
            case 'employees':
                searchEmployees(searchTerm);
                break;
            case 'departments':
                searchDepartments(searchTerm);
                break;
            case 'attendance':
                searchAttendance(searchTerm);
                break;
            case 'payroll':
                searchPayroll(searchTerm);
                break;
            case 'reports':
                searchReports(searchTerm);
                break;
            case 'dashboard':
                searchDashboard(searchTerm);
                break;
            default:
                console.log('Unknown page type for search');
        }
    });
}

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('employees.html')) return 'employees';
    if (path.includes('departments.html')) return 'departments';
    if (path.includes('attendance.html')) return 'attendance';
    if (path.includes('payroll.html')) return 'payroll';
    if (path.includes('reports.html')) return 'reports';
    return 'dashboard'; // Default to dashboard
}

function updateSearchPlaceholder(searchInput, pageName) {
    switch(pageName) {
        case 'employees':
            searchInput.placeholder = 'Search employees by name, position, department...';
            break;
        case 'departments':
            searchInput.placeholder = 'Search departments by name or description...';
            break;
        case 'attendance':
            searchInput.placeholder = 'Search attendance by employee name or date...';
            break;
        case 'payroll':
            searchInput.placeholder = 'Search payroll by employee name or date...';
            break;
        case 'reports':
            searchInput.placeholder = 'Search reports by type or date...';
            break;
        case 'dashboard':
            searchInput.placeholder = 'Search across all modules...';
            break;
    }
}

// Search functions for each page type
function searchEmployees(searchTerm) {
    const table = document.getElementById('employeesTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    if (rows.length === 0) return;
    
    rows.forEach(row => {
        const name = row.cells[0]?.textContent?.toLowerCase() || '';
        const email = row.cells[1]?.textContent?.toLowerCase() || '';
        const position = row.cells[2]?.textContent?.toLowerCase() || '';
        const department = row.cells[3]?.textContent?.toLowerCase() || '';
        
        if (
            searchTerm === '' || 
            name.includes(searchTerm) || 
            email.includes(searchTerm) || 
            position.includes(searchTerm) || 
            department.includes(searchTerm)
        ) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show "no results" message if all rows are hidden
    showNoResultsMessage(table, rows);
}

function searchDepartments(searchTerm) {
    const table = document.getElementById('departmentsTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    // Skip the header row
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = row.cells[0]?.textContent?.toLowerCase() || '';
        const description = row.cells[1]?.textContent?.toLowerCase() || '';
        
        if (
            searchTerm === '' || 
            name.includes(searchTerm) || 
            description.includes(searchTerm)
        ) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
    
    // Show "no results" message if all rows are hidden
    showNoResultsMessage(table, Array.from(rows).slice(1));
}

function searchAttendance(searchTerm) {
    const table = document.getElementById('attendanceTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    // Skip the header row
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const employeeName = row.cells[0]?.textContent?.toLowerCase() || '';
        const date = row.cells[1]?.textContent?.toLowerCase() || '';
        const status = row.cells[2]?.textContent?.toLowerCase() || '';
        
        if (
            searchTerm === '' || 
            employeeName.includes(searchTerm) || 
            date.includes(searchTerm) || 
            status.includes(searchTerm)
        ) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
    
    // Show "no results" message if all rows are hidden
    showNoResultsMessage(table, Array.from(rows).slice(1));
}

function searchPayroll(searchTerm) {
    const table = document.getElementById('payrollTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    // Skip the header row
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const employeeName = row.cells[0]?.textContent?.toLowerCase() || '';
        const payPeriod = row.cells[1]?.textContent?.toLowerCase() || '';
        const payDate = row.cells[2]?.textContent?.toLowerCase() || '';
        const amount = row.cells[3]?.textContent?.toLowerCase() || '';
        
        if (
            searchTerm === '' || 
            employeeName.includes(searchTerm) || 
            payPeriod.includes(searchTerm) || 
            payDate.includes(searchTerm) || 
            amount.includes(searchTerm)
        ) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
    
    // Show "no results" message if all rows are hidden
    showNoResultsMessage(table, Array.from(rows).slice(1));
}

function searchReports(searchTerm) {
    // For reports, we'll search the report titles and dates if available
    const reportContainers = document.querySelectorAll('.report-section');
    if (reportContainers.length === 0) return;
    
    reportContainers.forEach(container => {
        const title = container.querySelector('h3')?.textContent?.toLowerCase() || '';
        const dateElements = container.querySelectorAll('.date-filter input');
        let datesText = '';
        dateElements.forEach(dateEl => {
            datesText += dateEl.value?.toLowerCase() || '';
        });
        
        if (
            searchTerm === '' || 
            title.includes(searchTerm) || 
            datesText.includes(searchTerm)
        ) {
            container.style.display = '';
        } else {
            container.style.display = 'none';
        }
    });
    
    // Check if all sections are hidden
    const allHidden = Array.from(reportContainers).every(container => 
        container.style.display === 'none'
    );
    
    const noResultsMsg = document.getElementById('noReportResults');
    if (allHidden) {
        if (!noResultsMsg) {
            const msg = document.createElement('div');
            msg.id = 'noReportResults';
            msg.className = 'no-results';
            msg.textContent = 'No reports match your search criteria.';
            document.querySelector('.content-area').appendChild(msg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

function searchDashboard(searchTerm) {
    // For dashboard, we'll search recent employees and upcoming paydays
    searchDashboardEmployees(searchTerm);
    searchDashboardPaydays(searchTerm);
}

function searchDashboardEmployees(searchTerm) {
    const table = document.getElementById('recentEmployeesTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    // Skip the header row
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = row.cells[0]?.textContent?.toLowerCase() || '';
        const position = row.cells[1]?.textContent?.toLowerCase() || '';
        const department = row.cells[2]?.textContent?.toLowerCase() || '';
        
        if (
            searchTerm === '' || 
            name.includes(searchTerm) || 
            position.includes(searchTerm) || 
            department.includes(searchTerm)
        ) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
    
    // Show "no results" message if all rows are hidden
    showNoResultsMessage(table, Array.from(rows).slice(1));
}

function searchDashboardPaydays(searchTerm) {
    const table = document.getElementById('upcomingPaydaysTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    // Skip the header row
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const employee = row.cells[0]?.textContent?.toLowerCase() || '';
        const payDate = row.cells[1]?.textContent?.toLowerCase() || '';
        const amount = row.cells[2]?.textContent?.toLowerCase() || '';
        
        if (
            searchTerm === '' || 
            employee.includes(searchTerm) || 
            payDate.includes(searchTerm) || 
            amount.includes(searchTerm)
        ) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
    
    // Show "no results" message if all rows are hidden
    showNoResultsMessage(table, Array.from(rows).slice(1));
}

function showNoResultsMessage(table, rows) {
    // Check if all rows are hidden
    const allHidden = Array.from(rows).every(row => 
        row.style.display === 'none'
    );
    
    // Get the parent container of the table
    const tableContainer = table.closest('.table-container');
    if (!tableContainer) return;
    
    // Check if we already have a no results message
    let noResultsMsg = tableContainer.querySelector('.no-results');
    
    if (allHidden) {
        // Show no results message if it doesn't exist yet
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results';
            noResultsMsg.textContent = 'No items match your search criteria.';
            noResultsMsg.style.textAlign = 'center';
            noResultsMsg.style.padding = '20px';
            noResultsMsg.style.color = '#666';
            tableContainer.appendChild(noResultsMsg);
        }
        // Hide the table but keep the header
        table.style.display = 'none';
    } else {
        // Remove no results message if it exists
        if (noResultsMsg) {
            noResultsMsg.remove();
        }
        // Make sure table is visible
        table.style.display = '';
    }
}
