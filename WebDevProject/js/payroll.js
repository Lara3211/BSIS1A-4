document.addEventListener('DOMContentLoaded', function() {
    // Load payroll data
    loadPayroll();
    
    // Set up event listeners
    setupPayrollEvents();
});

// Load payroll from localStorage
function loadPayroll() {
    const payrollTable = document.getElementById('payrollTable');
    if (!payrollTable) return;
    
    // Get payroll data
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    
    // Sort by pay date (descending)
    const sortedPayroll = [...payroll].sort((a, b) => {
        return new Date(b.payDate) - new Date(a.payDate);
    });
    
    // Clear existing table rows
    payrollTable.innerHTML = '';
    
    // Add table header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Employee</th>
        <th>Pay Period</th>
        <th>Pay Date</th>
        <th>Gross Salary</th>
        <th>Total Deductions</th>
        <th>Net Salary</th>
        <th>Actions</th>
    `;
    payrollTable.appendChild(headerRow);
    
    // Get employees data
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Add table rows for each payroll record
    sortedPayroll.forEach(record => {
        // Find employee
        const employee = employees.find(emp => emp.id === record.employeeId);
        
        if (employee) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${record.payPeriod}</td>
                <td>${formatDate(record.payDate)}</td>
                <td>${formatCurrency(record.baseSalary)}</td>
                <td>${formatCurrency(record.totalDeductions)}</td>
                <td>${formatCurrency(record.netSalary)}</td>
                <td>
                    <button class="action-btn view-btn" data-id="${record.id}">View</button>
                    <button class="action-btn edit-btn" data-id="${record.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${record.id}">Delete</button>
                </td>
            `;
            payrollTable.appendChild(row);
        }
    });
}

// Set up event listeners for payroll actions
function setupPayrollEvents() {
    // Get form and buttons
    const generatePayrollBtn = document.getElementById('generatePayrollBtn');
    const payrollForm = document.getElementById('payrollForm');
    const payrollModal = document.getElementById('payrollModal');
    const payrollDetailsModal = document.getElementById('payrollDetailsModal');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    
    // Generate payroll button event
    if (generatePayrollBtn) {
        generatePayrollBtn.addEventListener('click', function() {
            openGeneratePayrollForm();
        });
    }
    
    // Close modal buttons event
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            payrollModal.style.display = 'none';
            if (payrollDetailsModal) {
                payrollDetailsModal.style.display = 'none';
            }
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target === payrollModal) {
            payrollModal.style.display = 'none';
        }
        if (payrollDetailsModal && event.target === payrollDetailsModal) {
            payrollDetailsModal.style.display = 'none';
        }
    });
    
    // Form submit event
    if (payrollForm) {
        payrollForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const payrollData = {
                employeeId: parseInt(formData.get('employeeId')),
                payPeriod: formData.get('payPeriod'),
                payDate: formData.get('payDate'),
                baseSalary: parseFloat(formData.get('baseSalary')),
                deductions: {
                    tax: parseFloat(formData.get('tax')),
                    sss: parseFloat(formData.get('sss')),
                    philhealth: parseFloat(formData.get('philhealth')),
                    pagibig: parseFloat(formData.get('pagibig'))
                }
            };
            
            // Calculate total deductions and net salary
            payrollData.totalDeductions = 
                payrollData.deductions.tax + 
                payrollData.deductions.sss + 
                payrollData.deductions.philhealth + 
                payrollData.deductions.pagibig;
            
            payrollData.netSalary = payrollData.baseSalary - payrollData.totalDeductions;
            
            // Validate form data
            if (!validatePayrollForm(payrollData)) {
                return;
            }
            
            // Get mode (add or edit)
            const mode = this.dataset.mode;
            
            if (mode === 'add') {
                // Add new payroll record
                addPayroll(payrollData);
            } else if (mode === 'edit') {
                // Edit existing payroll record
                const id = parseInt(this.dataset.id);
                editPayroll(id, payrollData);
            }
            
            // Hide modal
            payrollModal.style.display = 'none';
            
            // Reload payroll
            loadPayroll();
        });
    }
    
    // Delegate click events for action buttons
    document.addEventListener('click', function(e) {
        // View button
        if (e.target.classList.contains('view-btn') && e.target.closest('#payrollTable')) {
            const id = parseInt(e.target.dataset.id);
            viewPayslip(id);
        }
        
        // Edit button
        if (e.target.classList.contains('edit-btn') && e.target.closest('#payrollTable')) {
            const id = parseInt(e.target.dataset.id);
            openEditPayrollForm(id);
        }
        
        // Delete button
        if (e.target.classList.contains('delete-btn') && e.target.closest('#payrollTable')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Are you sure you want to delete this payroll record?')) {
                deletePayroll(id);
                loadPayroll();
            }
        }
    });

    // Add event listener for employee select change
    const employeeSelect = document.getElementById('employeeId');
    if (employeeSelect) {
        employeeSelect.addEventListener('change', function() {
            updateBaseSalary();
        });
    }
}

// Add new payroll record
function addPayroll(payrollData) {
    // Get existing payroll records
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    
    // Add ID to new payroll record
    payrollData.id = generateId();
    
    // Add to array
    payroll.push(payrollData);
    
    // Save to localStorage
    localStorage.setItem('payroll', JSON.stringify(payroll));
}

// Edit payroll record
function editPayroll(id, payrollData) {
    // Get existing payroll records
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    
    // Find payroll index
    const index = payroll.findIndex(p => p.id === id);
    
    if (index !== -1) {
        // Update payroll data, preserving the ID
        payroll[index] = { ...payrollData, id: id };
        
        // Save to localStorage
        localStorage.setItem('payroll', JSON.stringify(payroll));
    }
}

// Delete payroll record
function deletePayroll(id) {
    // Get existing payroll records
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    
    // Filter out the payroll to delete
    const updatedPayroll = payroll.filter(p => p.id !== id);
    
    // Save to localStorage
    localStorage.setItem('payroll', JSON.stringify(updatedPayroll));
}

// Open generate payroll form
function openGeneratePayrollForm() {
    // Get payroll modal and form
    const payrollModal = document.getElementById('payrollModal');
    const payrollForm = document.getElementById('payrollForm');
    
    if (!payrollModal || !payrollForm) return;
    
    // Reset form
    payrollForm.reset();
    
    // Populate employee dropdown
    populateEmployeeDropdown();
    
    // Set default pay period and date
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();
    
    const payPeriod = `${currentMonth} ${currentYear}`;
    const payDate = `${currentYear}-${(now.getMonth() + 1).toString().padStart(2, '0')}-15`;
    
    payrollForm.elements['payPeriod'].value = payPeriod;
    payrollForm.elements['payDate'].value = payDate;
    
    // Set form mode to add
    payrollForm.dataset.mode = 'add';
    payrollForm.dataset.id = '';
    
    // Update modal title
    const modalTitle = payrollModal.querySelector('.form-header h2');
    if (modalTitle) {
        modalTitle.textContent = 'Generate Payroll';
    }
    
    // Set default tax rate and contributions
    payrollForm.elements['tax'].value = '';
    payrollForm.elements['sss'].value = '1200';
    payrollForm.elements['philhealth'].value = '400';
    payrollForm.elements['pagibig'].value = '200';
    
    // Set base salary based on selected employee
    updateBaseSalary();
    
    // Show modal
    payrollModal.style.display = 'block';
}

// Open edit payroll form
function openEditPayrollForm(id) {
    // Get payroll modal and form
    const payrollModal = document.getElementById('payrollModal');
    const payrollForm = document.getElementById('payrollForm');
    
    if (!payrollModal || !payrollForm) return;
    
    // Get existing payroll records
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    
    // Find payroll record
    const record = payroll.find(p => p.id === id);
    
    if (record) {
        // Populate employee dropdown
        populateEmployeeDropdown();
        
        // Set form fields
        payrollForm.elements['employeeId'].value = record.employeeId;
        payrollForm.elements['payPeriod'].value = record.payPeriod;
        payrollForm.elements['payDate'].value = record.payDate;
        payrollForm.elements['baseSalary'].value = record.baseSalary;
        payrollForm.elements['tax'].value = record.deductions.tax;
        payrollForm.elements['sss'].value = record.deductions.sss;
        payrollForm.elements['philhealth'].value = record.deductions.philhealth;
        payrollForm.elements['pagibig'].value = record.deductions.pagibig;
        
        // Set form mode to edit
        payrollForm.dataset.mode = 'edit';
        payrollForm.dataset.id = id;
        
        // Update modal title
        const modalTitle = payrollModal.querySelector('.form-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Payroll Record';
        }
        
        // Show modal
        payrollModal.style.display = 'block';
    }
}






// WALA FUNCTION --------------------------------------------------------------------
function viewPayslip() {
            const payrollDetailsModal = document.getElementById('payrollDetailsModal');
            payrollDetailsModal.style.display = 'block';
}
// WALA FUNCTION --------------------------------------------------------------------








// Populate employee dropdown in payroll form
function populateEmployeeDropdown() {
    const employeeSelect = document.getElementById('employeeId');
    if (!employeeSelect) return;
    
    // Get employees
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Clear existing options
    employeeSelect.innerHTML = '<option value="">Select Employee</option>';
    
    // Add options for each employee
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelect.appendChild(option);
    });
}

// Update base salary based on selected employee
function updateBaseSalary() {
    const employeeSelect = document.getElementById('employeeId');
    const baseSalaryInput = document.getElementById('baseSalary');
    const taxInput = document.getElementById('tax');
    
    if (!employeeSelect || !baseSalaryInput || !taxInput) return;
    
    const selectedEmployeeId = parseInt(employeeSelect.value);
    if (!selectedEmployeeId) {
        baseSalaryInput.value = '';
        taxInput.value = '';
        return;
    }
    
    // Get employees
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Find selected employee
    const employee = employees.find(emp => emp.id === selectedEmployeeId);
    
    if (employee) {
        // Set base salary
        baseSalaryInput.value = employee.salary;
        
        // Calculate tax (12% of salary)
        const tax = employee.salary * 0.12;
        taxInput.value = tax.toFixed(2);
    }
}

// Validate payroll form
function validatePayrollForm(payrollData) {
    // Check required fields
    if (!payrollData.employeeId || !payrollData.payPeriod || !payrollData.payDate || 
        !payrollData.baseSalary || !payrollData.deductions.tax || !payrollData.deductions.sss || 
        !payrollData.deductions.philhealth || !payrollData.deductions.pagibig) {
        alert('Please fill in all required fields.');
        return false;
    }
    
    // Validate numeric values
    if (isNaN(payrollData.baseSalary) || payrollData.baseSalary <= 0) {
        alert('Please enter a valid base salary amount.');
        return false;
    }
    
    return true;
}