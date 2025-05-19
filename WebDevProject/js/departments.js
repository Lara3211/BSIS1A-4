document.addEventListener('DOMContentLoaded', function() {
    // Initialize local storage if needed
    initializeLocalStorage();
    
    // Load departments data
    loadDepartments();
    
    // Set up event listeners
    setupDepartmentEvents();
});

// Load departments from localStorage
function loadDepartments() {
    const departmentsTable = document.querySelector('#departmentsTable');
    if (!departmentsTable) return;
    
    // Get departments data
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    // Clear existing table rows except the header
    while (departmentsTable.rows.length > 1) {
        departmentsTable.deleteRow(1);
    }
    
    if (departments.length === 0) {
        const emptyRow = departmentsTable.insertRow();
        const cell = emptyRow.insertCell(0);
        cell.colSpan = 4;
        cell.className = 'text-center';
        cell.textContent = 'No departments found. Add your first department using the button above.';
        return;
    }
    
    // Get employees to count by department
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Add table rows for each department
    departments.forEach(department => {
        // Count employees in this department
        const employeeCount = employees.filter(emp => emp.department === department.name).length;
        
        const row = departmentsTable.insertRow();
        row.innerHTML = `
            <td>${department.name}</td>
            <td>${department.description}</td>
            <td>${employeeCount}</td>
            <td>
                <button class="action-btn view-btn" data-id="${department.id}">View</button>
                <button class="action-btn edit-btn" data-id="${department.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${department.id}">Delete</button>
            </td>
        `;
    });
}

// Set up event listeners for department actions
function setupDepartmentEvents() {
    // Get form and buttons
    const addDepartmentForm = document.getElementById('addDepartmentForm');
    const addDepartmentBtn = document.getElementById('addDepartmentBtn');
    const departmentModal = document.getElementById('departmentModal');
    const departmentDetailsModal = document.getElementById('departmentDetailsModal');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    
    // Add department button event
    if (addDepartmentBtn) {
        addDepartmentBtn.addEventListener('click', function() {
            // Reset form
            if (addDepartmentForm) {
                addDepartmentForm.reset();
                addDepartmentForm.dataset.mode = 'add';
                addDepartmentForm.dataset.id = '';
                
                // Update modal title
                const modalTitle = departmentModal.querySelector('.form-header h2');
                if (modalTitle) {
                    modalTitle.textContent = 'Add New Department';
                }
                
                // Show modal
                departmentModal.style.display = 'block';
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
    if (addDepartmentForm) {
        addDepartmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const departmentData = {
                name: formData.get('name'),
                description: formData.get('description')
            };
            
            // Validate form data
            if (!validateDepartmentForm(departmentData)) {
                return;
            }
            
            // Get mode (add or edit)
            const mode = this.dataset.mode;
            
            if (mode === 'add') {
                // Add new department
                addDepartment(departmentData);
            } else if (mode === 'edit') {
                // Edit existing department
                const id = parseInt(this.dataset.id);
                editDepartment(id, departmentData);
            }
            
            // Hide modal
            departmentModal.style.display = 'none';
            
            // Reload departments
            loadDepartments();
        });
    }
    
    // Delegate click events for action buttons
    document.addEventListener('click', function(e) {
        // View button
        if (e.target.classList.contains('view-btn')) {
            const id = parseInt(e.target.dataset.id);
            viewDepartment(id);
        }
        
        // Edit button
        if (e.target.classList.contains('edit-btn')) {
            const id = parseInt(e.target.dataset.id);
            openEditDepartmentForm(id);
        }
        
        // Delete button
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this department?')) {
                const id = parseInt(e.target.dataset.id);
                deleteDepartment(id);
                loadDepartments();
            }
        }
    });
}

// Add new department
function addDepartment(departmentData) {
    // Get existing departments
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    // Check if department with the same name already exists
    const departmentExists = departments.some(dept => dept.name === departmentData.name);
    if (departmentExists) {
        alert('A department with this name already exists');
        return;
    }
    
    // Generate new ID
    const id = generateId();
    
    // Add ID to department data
    departmentData.id = id;
    
    // Add to array
    departments.push(departmentData);
    
    // Save to localStorage
    localStorage.setItem('departments', JSON.stringify(departments));
}

// Edit department
function editDepartment(id, departmentData) {
    // Get existing departments
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    // Find department index
    const index = departments.findIndex(dept => dept.id === id);
    
    if (index !== -1) {
        // Check if we're changing the name and if the new name already exists
        const oldName = departments[index].name;
        const newName = departmentData.name;
        
        if (oldName !== newName) {
            const nameExists = departments.some(dept => dept.id !== id && dept.name === newName);
            if (nameExists) {
                alert('A department with this name already exists.');
                return;
            }
            
            // Update employee records with new department name
            updateEmployeeDepartments(oldName, newName);
        }
        
        // Update department data, preserving the ID
        departments[index] = { ...departmentData, id: id };
        
        // Save to localStorage
        localStorage.setItem('departments', JSON.stringify(departments));
    }
}

// Update employee records when department name changes
function updateEmployeeDepartments(oldName, newName) {
    // Get existing employees
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Update department name for affected employees
    const updatedEmployees = employees.map(emp => {
        if (emp.department === oldName) {
            return { ...emp, department: newName };
        }
        return emp;
    });
    
    // Save to localStorage
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
}

// Delete department
function deleteDepartment(id) {
    // Get existing departments
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    // Find department to delete
    const departmentToDelete = departments.find(dept => dept.id === id);
    
    if (departmentToDelete) {
        // Check if there are employees in this department
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const employeesInDept = employees.filter(emp => emp.department === departmentToDelete.name);
        
        if (employeesInDept.length > 0) {
            alert(`Cannot delete department. There are ${employeesInDept.length} employees assigned to this department.`);
            return;
        }
        
        // Filter out the department to delete
        const updatedDepartments = departments.filter(dept => dept.id !== id);
        
        // Save to localStorage
        localStorage.setItem('departments', JSON.stringify(updatedDepartments));
    }
}

// View department details
function viewDepartment(id) {
    // Get department details modal
    const departmentDetailsModal = document.getElementById('departmentDetailsModal');
    if (!departmentDetailsModal) {
        console.error("Department details modal not found");
        return;
    }
    
    // Get existing departments
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    // Find department
    const department = departments.find(dept => dept.id === id);
    
    if (department) {
        // Get employees in this department
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const departmentEmployees = employees.filter(emp => emp.department === department.name);
        
        // Populate department details
        const detailsContainer = document.getElementById('departmentDetails');
        
        if (detailsContainer) {
            let employeesList = '';
            
            if (departmentEmployees.length > 0) {
                employeesList = `
                    <h4>Employees in Department</h4>
                    <div class="table-container">
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Position</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${departmentEmployees.map(emp => `
                                    <tr>
                                        <td>${emp.name}</td>
                                        <td>${emp.position}</td>
                                        <td>${emp.email}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                employeesList = '<p>No employees in this department</p>';
            }
            
            detailsContainer.innerHTML = `
                <div class="department-details">
                    <h3>${department.name}</h3>
                    <p><strong>Description:</strong> ${department.description}</p>
                    <p><strong>Number of Employees:</strong> ${departmentEmployees.length}</p>
                    ${employeesList}
                </div>
            `;
        } else {
            console.error("Department details container not found");
        }
        
        // Show modal
        departmentDetailsModal.style.display = 'block';
    }
}

// Open edit department form
function openEditDepartmentForm(id) {
    // Get department modal and form
    const departmentModal = document.getElementById('departmentModal');
    const addDepartmentForm = document.getElementById('addDepartmentForm');
    
    if (!departmentModal || !addDepartmentForm) return;
    
    // Get existing departments
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    // Find department
    const department = departments.find(dept => dept.id === id);
    
    if (department) {
        // Set form fields
        addDepartmentForm.elements['name'].value = department.name;
        addDepartmentForm.elements['description'].value = department.description;
        
        // Set form mode to edit
        addDepartmentForm.dataset.mode = 'edit';
        addDepartmentForm.dataset.id = id;
        
        // Update modal title
        const modalTitle = departmentModal.querySelector('.form-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Department';
        }
        
        // Show modal
        departmentModal.style.display = 'block';
    }
}

// Validate department form data
function validateDepartmentForm(departmentData) {
    // Check department name
    if (!departmentData.name || departmentData.name.trim() === '') {
        alert('Please enter a valid department name');
        return false;
    }
    
    // Check description
    if (!departmentData.description || departmentData.description.trim() === '') {
        alert('Please enter a department description');
        return false;
    }
    
    return true;
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
}