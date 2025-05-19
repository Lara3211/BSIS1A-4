document.addEventListener('DOMContentLoaded', function() {
    initializeLocalStorage();
    loadEmployees();
    setupEmployeeEvents();
    populateFormDropdowns();
});

function loadEmployees() {
    const employeesTable = document.querySelector('#employeesTable tbody');
    if (!employeesTable) return;
    
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    employeesTable.innerHTML = '';
    
    if (employees.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="6" class="text-center">No employees found. Add your first employee using the button above.</td>';
        employeesTable.appendChild(emptyRow);
        return;
    }
    
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

function setupEmployeeEvents() {
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    const employeeModal = document.getElementById('employeeModal');
    const employeeDetailsModal = document.getElementById('employeeDetailsModal');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', function() {
            if (addEmployeeForm) {
                addEmployeeForm.reset();
                addEmployeeForm.dataset.mode = 'add';
                addEmployeeForm.dataset.id = '';
                
                const modalTitle = employeeModal.querySelector('.form-header h2');
                if (modalTitle) {
                    modalTitle.textContent = 'Add New Employee';
                }
                
                employeeModal.style.display = 'block';
            }
        });
    }
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    if (addEmployeeForm) {
        addEmployeeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const employeeData = {
                name: formData.get('name'),
                email: formData.get('email'),
                position: formData.get('position'),
                department: formData.get('department'),
                salary: parseFloat(formData.get('salary')),
                dateHired: formData.get('dateHired')
            };
            
            if (!validateEmployeeForm(employeeData)) {
                return;
            }
            
            const mode = this.dataset.mode;
            
            if (mode === 'add') {
                addEmployee(employeeData);
            } else if (mode === 'edit') {
                const id = parseInt(this.dataset.id);
                editEmployee(id, employeeData);
            }
            
            employeeModal.style.display = 'none';
            loadEmployees();
        });
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-btn')) {
            const id = parseInt(e.target.dataset.id);
            viewEmployee(id);
        }
        
        if (e.target.classList.contains('edit-btn')) {
            const id = parseInt(e.target.dataset.id);
            openEditEmployeeForm(id);
        }
        
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this employee?')) {
                const id = parseInt(e.target.dataset.id);
                deleteEmployee(id);
                loadEmployees();
            }
        }
    });
}

function addEmployee(employeeData) {
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const id = generateId();
    employees.push({
        id: id,
        ...employeeData
    });
    localStorage.setItem('employees', JSON.stringify(employees));
}

function editEmployee(id, employeeData) {
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const index = employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
        employees[index] = { ...employeeData, id: id };
        localStorage.setItem('employees', JSON.stringify(employees));
    }
}

function deleteEmployee(id) {
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const updatedEmployees = employees.filter(emp => emp.id !== id);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
}

function viewEmployee(id) {
    const employeeDetailsModal = document.getElementById('employeeDetailsModal');
    if (!employeeDetailsModal) {
        console.error("Employee details modal not found");
        return;
    }
    
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const employee = employees.find(emp => emp.id === id);
    
    if (employee) {
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
        
        employeeDetailsModal.style.display = 'block';
    }
}

function openEditEmployeeForm(id) {
    const employeeModal = document.getElementById('employeeModal');
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    
    if (!employeeModal || !addEmployeeForm) return;
    
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const employee = employees.find(emp => emp.id === id);
    
    if (employee) {
        addEmployeeForm.elements['name'].value = employee.name;
        addEmployeeForm.elements['email'].value = employee.email;
        addEmployeeForm.elements['position'].value = employee.position;
        addEmployeeForm.elements['department'].value = employee.department;
        addEmployeeForm.elements['salary'].value = employee.salary;
        addEmployeeForm.elements['dateHired'].value = employee.dateHired;
        
        addEmployeeForm.dataset.mode = 'edit';
        addEmployeeForm.dataset.id = id;
        
        const modalTitle = employeeModal.querySelector('.form-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Employee';
        }
        
        employeeModal.style.display = 'block';
    }
}

function validateEmployeeForm(employeeData) {
    if (!employeeData.name || employeeData.name.trim() === '') {
        alert('Please enter a valid name');
        return false;
    }
    
    if (!employeeData.email || !isValidEmail(employeeData.email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    if (!employeeData.position || employeeData.position.trim() === '') {
        alert('Please enter a valid position');
        return false;
    }
    
    if (!employeeData.department || employeeData.department.trim() === '') {
        alert('Please select a department');
        return false;
    }
    
    if (!employeeData.salary || isNaN(employeeData.salary) || employeeData.salary <= 0) {
        alert('Please enter a valid salary amount');
        return false;
    }
    
    if (!employeeData.dateHired || employeeData.dateHired.trim() === '') {
        alert('Please enter a valid date hired');
        return false;
    }
    
    return true;
}

function populateFormDropdowns() {
    const departmentSelect = document.getElementById('department');
    if (!departmentSelect) return;
    
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    while (departmentSelect.options.length > 1) {
        departmentSelect.options.remove(1);
    }
    
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
    });
}

function initializeLocalStorage() {
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    if (departments.length === 0) {
        const sampleDepartments = [
            { id: 1, name: 'HR', description: 'Human Resources Department' },
            { id: 2, name: 'IT', description: 'Information Technology Department' },
            { id: 3, name: 'Finance', description: 'Finance Department' },
            { id: 4, name: 'Marketing', description: 'Marketing Department' }
        ];
        localStorage.setItem('departments', JSON.stringify(sampleDepartments));
    }
    
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    if (employees.length === 0) {
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
