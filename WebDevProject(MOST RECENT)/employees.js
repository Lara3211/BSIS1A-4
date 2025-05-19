document.addEventListener('DOMContentLoaded', function() {
    // Initialize local storage if needed
    initializeLocalStorage();
    
    // Load employees data
    loadEmployees();
    
    // Set up event listeners
    setupEmployeeEvents();
    
    // Populate department dropdown
    populateFormDropdowns();
});

// Load employees from localStorage
function loadEmployees() {
    const employeesTable = document.querySelector('#employeesTable tbody');
    if (!employeesTable) return;
    
    // Get employees data
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Clear existing table rows
    employeesTable.innerHTML = '';
    
    if (employees.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="6" class="text-center">No employees found. Add your first employee using the button above.</td>';
        employeesTable.appendChild(emptyRow);
        return;
    }
    
    // Add table rows for each employee
    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.email}</td>
            <td>${employee.position}</td>
            <td>${employee.department}</td>
            <td>${formatDate(employee.dateHired)}</td>
            <td>
                <button class="action-btn view-btn" data-id="${employee.id}">View</button>
                <button class="action-btn edit-btn" data-id="${employee.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${employee.id}">Delete</button>
            </td>
        `;
        employeesTable.appendChild(row);
    });
}

// Set up event listeners for employee actions
function setupEmployeeEvents() {
    // Get form and buttons
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    const employeeModal = document.getElementById('employeeModal');
    const employeeDetailsModal = document.getElementById('employeeDetailsModal');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    
    // Add employee button event
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', function() {
            // Reset form
            if (addEmployeeForm) {
                addEmployeeForm.reset();
                addEmployeeForm.dataset.mode = 'add';
                addEmployeeForm.dataset.id = '';
                
                // Update modal title
                const modalTitle = employeeModal.querySelector('.form-header h2');
                if (modalTitle) {
                    modalTitle.textContent = 'Add New Employee';
                }
                
                // Show modal
                employeeModal.style.display = 'block';
            }
        });
    }
    
    // Close modal buttons event
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Find the parent modal of this close button
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Form submit event
    if (addEmployeeForm) {
        addEmployeeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const employeeData = {
                name: formData.get('name'),
                email: formData.get('email'),
                position: formData.get('position'),
                department: formData.get('department'),
                salary: parseFloat(formData.get('salary')),
                dateHired: formData.get('dateHired')
            };
            
            // Validate form data
            if (!validateEmployeeForm(employeeData)) {
                return;
            }
            
            // Get mode (add or edit)
            const mode = this.dataset.mode;
            
            if (mode === 'add') {
                // Add new employee
                addEmployee(employeeData);
            } else if (mode === 'edit') {
                // Edit existing employee
                const id = parseInt(this.dataset.id);
                editEmployee(id, employeeData);
            }
            
            // Hide modal
            employeeModal.style.display = 'none';
            
            // Reload employees
            loadEmployees();
        });
    }
    
    // Delegate click events for action buttons
    document.addEventListener('click', function(e) {
        // View button
        if (e.target.classList.contains('view-btn')) {
            const id = parseInt(e.target.dataset.id);
            viewEmployee(id);
        }
        
        // Edit button
        if (e.target.classList.contains('edit-btn')) {
            const id = parseInt(e.target.dataset.id);
            openEditEmployeeForm(id);
        }
        
        // Delete button
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this employee?')) {
                const id = parseInt(e.target.dataset.id);
                deleteEmployee(id);
                loadEmployees();
            }
        }
    });
}

// Add new employee
function addEmployee(employeeData) {
    // Get existing employees
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Generate new ID
    const id = generateId();
    
    // Add new employee with ID
    employees.push({
        id: id,
        ...employeeData
    });
    
    // Save to localStorage
    localStorage.setItem('employees', JSON.stringify(employees));
}

// Edit employee
function editEmployee(id, employeeData) {
    // Get existing employees
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Find employee index
    const index = employees.findIndex(emp => emp.id === id);
    
    if (index !== -1) {
        // Update employee data, preserving the ID
        employees[index] = { ...employeeData, id: id };
        
        // Save to localStorage
        localStorage.setItem('employees', JSON.stringify(employees));
    }
}

// Delete employee
function deleteEmployee(id) {
    // Get existing employees
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Filter out the employee to delete
    const updatedEmployees = employees.filter(emp => emp.id !== id);
    
    // Save to localStorage
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
}

// View employee details
function viewEmployee(id) {
    // Get employee details modal
    const employeeDetailsModal = document.getElementById('employeeDetailsModal');
    if (!employeeDetailsModal) {
        console.error("Employee details modal not found");
        return;
    }
    
    // Get existing employees
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Find employee
    const employee = employees.find(emp => emp.id === id);
    
    if (employee) {
        // Populate employee details
        const detailsContainer = document.getElementById('employeeDetails');
        
        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="employee-details">
                    <h3>${employee.name}</h3>
                    <p><strong>Email:</strong> ${employee.email}</p>
                    <p><strong>Position:</strong> ${employee.position}</p>
                    <p><strong>Department:</strong> ${employee.department}</p>
                    <p><strong>Salary:</strong> ${formatCurrency(employee.salary)}</p>
                    <p><strong>Date Hired:</strong> ${formatDate(employee.dateHired)}</p>
                    <p><strong>Years of Service:</strong> ${calculateYearsOfService(employee.dateHired)} years</p>
                </div>
            `;
        } else {
            console.error("Employee details container not found");
        }
        
        // Show modal
        employeeDetailsModal.style.display = 'block';
    }
}

// Open edit employee form
function openEditEmployeeForm(id) {
    // Get employee modal and form
    const employeeModal = document.getElementById('employeeModal');
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    
    if (!employeeModal || !addEmployeeForm) return;
    
    // Get existing employees
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Find employee
    const employee = employees.find(emp => emp.id === id);
    
    if (employee) {
        // Update form fields
        addEmployeeForm.elements['name'].value = employee.name;
        addEmployeeForm.elements['email'].value = employee.email;
        addEmployeeForm.elements['position'].value = employee.position;
        addEmployeeForm.elements['department'].value = employee.department;
        addEmployeeForm.elements['salary'].value = employee.salary;
        addEmployeeForm.elements['dateHired'].value = employee.dateHired;
        
        // Set form mode to edit
        addEmployeeForm.dataset.mode = 'edit';
        addEmployeeForm.dataset.id = id;
        
        // Update modal title
        const modalTitle = employeeModal.querySelector('.form-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Employee';
        }
        
        // Show modal
        employeeModal.style.display = 'block';
    }
}

// Validate employee form data
function validateEmployeeForm(employeeData) {
    // Check name
    if (!employeeData.name || employeeData.name.trim() === '') {
        alert('Please enter a valid name');
        return false;
    }
    
    // Check email
    if (!employeeData.email || !isValidEmail(employeeData.email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    // Check position
    if (!employeeData.position || employeeData.position.trim() === '') {
        alert('Please enter a valid position');
        return false;
    }
    
    // Check department
    if (!employeeData.department || employeeData.department.trim() === '') {
        alert('Please select a department');
        return false;
    }
    
    // Check salary
    if (!employeeData.salary || isNaN(employeeData.salary) || employeeData.salary <= 0) {
        alert('Please enter a valid salary amount');
        return false;
    }
    
    // Check date hired
    if (!employeeData.dateHired || employeeData.dateHired.trim() === '') {
        alert('Please enter a valid date hired');
        return false;
    }
    
    return true;
}

// Populate department dropdown in the form
function populateFormDropdowns() {
    const departmentSelect = document.getElementById('department');
    if (!departmentSelect) return;
    
    // Get departments from localStorage
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    // Clear existing options except the first placeholder option
    while (departmentSelect.options.length > 1) {
        departmentSelect.options.remove(1);
    }
    
    // Add department options
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
    });
}

// Initialize local storage with sample data if empty
function initializeLocalStorage() {
    // Check if departments exist
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    if (departments.length === 0) {
        // Add sample departments
        const sampleDepartments = [
            { id: 1, name: 'HR', description: 'Human Resources Department' },
            { id: 2, name: 'IT', description: 'Information Technology Department' },
            { id: 3, name: 'Finance', description: 'Finance Department' },
            { id: 4, name: 'Marketing', description: 'Marketing Department' }
        ];
        localStorage.setItem('departments', JSON.stringify(sampleDepartments));
    }
    
    // Check if employees exist
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    if (employees.length === 0) {
        // Add sample employees
        const sampleEmployees = [
            {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@bpc.edu.ph',
                position: 'Head Teacher',
                department: 'IT',
                salary: 35000,
                dateHired: '2018-06-15'
            },
            {
                id: 2,
                name: 'Maria Santos',
                email: 'maria.santos@bpc.edu.ph',
                position: 'HR Officer',
                department: 'HR',
                salary: 28000,
                dateHired: '2019-03-22'
            }
        ];
        localStorage.setItem('employees', JSON.stringify(sampleEmployees));
    }
}