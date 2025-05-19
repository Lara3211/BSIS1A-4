document.addEventListener('DOMContentLoaded', function() {
    loadPayroll();
    
    setupPayrollEvents();
});

function loadPayroll() {
    const payrollTable = document.getElementById('payrollTable');
    if (!payrollTable) return;

    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    const sortedPayroll = [...payroll].sort((a, b) => {
        return new Date(b.payDate) - new Date(a.payDate);
    });
    

    payrollTable.innerHTML = '';
    
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
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    

    sortedPayroll.forEach(record => {
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

function setupPayrollEvents() {
    const generatePayrollBtn = document.getElementById('generatePayrollBtn');
    const payrollForm = document.getElementById('payrollForm');
    const payrollModal = document.getElementById('payrollModal');
    const payrollDetailsModal = document.getElementById('payrollDetailsModal');
    const closeModalBtns = document.querySelectorAll('.close-btn');

    if (generatePayrollBtn) {
        generatePayrollBtn.addEventListener('click', function() {
            openGeneratePayrollForm();
        });
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            payrollModal.style.display = 'none';
            if (payrollDetailsModal) {
                payrollDetailsModal.style.display = 'none';
            }
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target === payrollModal) {
            payrollModal.style.display = 'none';
        }
        if (payrollDetailsModal && event.target === payrollDetailsModal) {
            payrollDetailsModal.style.display = 'none';
        }
    });

    if (payrollForm) {
        payrollForm.addEventListener('submit', function(e) {
            e.preventDefault();

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
            
            payrollData.totalDeductions = 
                payrollData.deductions.tax + 
                payrollData.deductions.sss + 
                payrollData.deductions.philhealth + 
                payrollData.deductions.pagibig;
            
            payrollData.netSalary = payrollData.baseSalary - payrollData.totalDeductions;
            
            if (!validatePayrollForm(payrollData)) {
                return;
            }

            const mode = this.dataset.mode;
            
            if (mode === 'add') {
                addPayroll(payrollData);
            } else if (mode === 'edit') {
                const id = parseInt(this.dataset.id);
                editPayroll(id, payrollData);
            }

            payrollModal.style.display = 'none';
            
            loadPayroll();
        });
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-btn') && e.target.closest('#payrollTable')) {
            const id = parseInt(e.target.dataset.id);
            viewPayslip(id);
        }
        
        if (e.target.classList.contains('edit-btn') && e.target.closest('#payrollTable')) {
            const id = parseInt(e.target.dataset.id);
            openEditPayrollForm(id);
        }

        if (e.target.classList.contains('delete-btn') && e.target.closest('#payrollTable')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Are you sure you want to delete this payroll record?')) {
                deletePayroll(id);
                loadPayroll();
            }
        }
    });

    const employeeSelect = document.getElementById('employeeId');
    if (employeeSelect) {
        employeeSelect.addEventListener('change', function() {
            updateBaseSalary();
        });
    }
}

function addPayroll(payrollData) {
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    payrollData.id = generateId();
    
    payroll.push(payrollData);
    
    localStorage.setItem('payroll', JSON.stringify(payroll));
}

function editPayroll(id, payrollData) {
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    const index = payroll.findIndex(p => p.id === id);
    
    if (index !== -1) {
        payroll[index] = { ...payrollData, id: id };
        localStorage.setItem('payroll', JSON.stringify(payroll));
    }
}

function deletePayroll(id) {
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    const updatedPayroll = payroll.filter(p => p.id !== id);

    localStorage.setItem('payroll', JSON.stringify(updatedPayroll));
}

function openGeneratePayrollForm() {
    const payrollModal = document.getElementById('payrollModal');
    const payrollForm = document.getElementById('payrollForm');
    
    if (!payrollModal || !payrollForm) return;
    
    payrollForm.reset();

    populateEmployeeDropdown();

    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();
    
    const payPeriod = `${currentMonth} ${currentYear}`;
    const payDate = `${currentYear}-${(now.getMonth() + 1).toString().padStart(2, '0')}-15`;
    
    payrollForm.elements['payPeriod'].value = payPeriod;
    payrollForm.elements['payDate'].value = payDate;
    
    payrollForm.dataset.mode = 'add';
    payrollForm.dataset.id = '';
    
    const modalTitle = payrollModal.querySelector('.form-header h2');
    if (modalTitle) {
        modalTitle.textContent = 'Generate Payroll';
    }
    
    payrollForm.elements['tax'].value = '';
    payrollForm.elements['sss'].value = '1200';
    payrollForm.elements['philhealth'].value = '400';
    payrollForm.elements['pagibig'].value = '200';
    
    updateBaseSalary();
    
    payrollModal.style.display = 'block';
}

function openEditPayrollForm(id) {
    const payrollModal = document.getElementById('payrollModal');
    const payrollForm = document.getElementById('payrollForm');
    
    if (!payrollModal || !payrollForm) return;
    
    const payroll = JSON.parse(localStorage.getItem('payroll')) || [];
    const record = payroll.find(p => p.id === id);
    
    if (record) {
        populateEmployeeDropdown();

        payrollForm.elements['employeeId'].value = record.employeeId;
        payrollForm.elements['payPeriod'].value = record.payPeriod;
        payrollForm.elements['payDate'].value = record.payDate;
        payrollForm.elements['baseSalary'].value = record.baseSalary;
        payrollForm.elements['tax'].value = record.deductions.tax;
        payrollForm.elements['sss'].value = record.deductions.sss;
        payrollForm.elements['philhealth'].value = record.deductions.philhealth;
        payrollForm.elements['pagibig'].value = record.deductions.pagibig;

        payrollForm.dataset.mode = 'edit';
        payrollForm.dataset.id = id;
        
        const modalTitle = payrollModal.querySelector('.form-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Payroll Record';
        }
        
        payrollModal.style.display = 'block';
    }
}



// WALA FUNCTION --------------------------------------------------------------------
function viewPayslip() {
            const payrollDetailsModal = document.getElementById('payrollDetailsModal');
            payrollDetailsModal.style.display = 'block';
}
// WALA FUNCTION --------------------------------------------------------------------


function populateEmployeeDropdown() {
    const employeeSelect = document.getElementById('employeeId');
    if (!employeeSelect) return;

    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    employeeSelect.innerHTML = '<option value="">Select Employee</option>';
    
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelect.appendChild(option);
    });
}

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
    
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    const employee = employees.find(emp => emp.id === selectedEmployeeId);
    
    if (employee) {
        baseSalaryInput.value = employee.salary;

        const tax = employee.salary * 0.12;
        taxInput.value = tax.toFixed(2);
    }
}

function validatePayrollForm(payrollData) {
    if (!payrollData.employeeId || !payrollData.payPeriod || !payrollData.payDate || 
        !payrollData.baseSalary || !payrollData.deductions.tax || !payrollData.deductions.sss || 
        !payrollData.deductions.philhealth || !payrollData.deductions.pagibig) {
        alert('Please fill in all required fields.');
        return false;
    }
    
    if (isNaN(payrollData.baseSalary) || payrollData.baseSalary <= 0) {
        alert('Please enter a valid base salary amount.');
        return false;
    }
    
    return true;
}
