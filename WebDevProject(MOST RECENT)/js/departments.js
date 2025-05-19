document.addEventListener('DOMContentLoaded', function() {
    initializeLocalStorage();
    loadDepartments();
    setupDepartmentEvents();
});

function loadDepartments() {
    const departmentsTable = document.querySelector('#departmentsTable');
    if (!departmentsTable) return;
    
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
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
    
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    departments.forEach(department => {
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

function setupDepartmentEvents() {
    const addDepartmentForm = document.getElementById('addDepartmentForm');
    const addDepartmentBtn = document.getElementById('addDepartmentBtn');
    const departmentModal = document.getElementById('departmentModal');
    const departmentDetailsModal = document.getElementById('departmentDetailsModal');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    
    addDepartmentBtn.addEventListener('click', function() {
        addDepartmentForm.reset();
        addDepartmentForm.dataset.mode = 'add';
        addDepartmentForm.dataset.id = '';
        
        const modalTitle = departmentModal.querySelector('.form-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Add New Department';
        }
        
        departmentModal.style.display = 'block';
    });
    
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
    
    addDepartmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const departmentData = {
            name: formData.get('name'),
            description: formData.get('description')
        };
        
        if (!validateDepartmentForm(departmentData)) {
            return;
        }
        
        const mode = this.dataset.mode;
        
        if (mode === 'add') {
            addDepartment(departmentData);
        } else if (mode === 'edit') {
            const id = parseInt(this.dataset.id);
            editDepartment(id, departmentData);
        }
        
        departmentModal.style.display = 'none';
        
        loadDepartments();
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-btn')) {
            const id = parseInt(e.target.dataset.id);
            viewDepartment(id);
        }
        
        if (e.target.classList.contains('edit-btn')) {
            const id = parseInt(e.target.dataset.id);
            openEditDepartmentForm(id);
        }
        
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this department?')) {
                const id = parseInt(e.target.dataset.id);
                deleteDepartment(id);
                loadDepartments();
            }
        }
    });
}

function addDepartment(departmentData) {
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    const departmentExists = departments.some(dept => dept.name === departmentData.name);
    if (departmentExists) {
        alert('A department with this name already exists');
        return;
    }
    
    const id = generateId();
    
    departmentData.id = id;
    
    departments.push(departmentData);
    
    localStorage.setItem('departments', JSON.stringify(departments));
}

function editDepartment(id, departmentData) {
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    const index = departments.findIndex(dept => dept.id === id);
    
    if (index !== -1) {
        const oldName = departments[index].name;
        const newName = departmentData.name;
        
        if (oldName !== newName) {
            const nameExists = departments.some(dept => dept.id !== id && dept.name === newName);
            if (nameExists) {
                alert('A department with this name already exists.');
                return;
            }
            
            updateEmployeeDepartments(oldName, newName);
        }
        
        departments[index] = { ...departmentData, id: id };
        
        localStorage.setItem('departments', JSON.stringify(departments));
    }
}

function updateEmployeeDepartments(oldName, newName) {
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    const updatedEmployees = employees.map(emp => {
        if (emp.department === oldName) {
            return { ...emp, department: newName };
        }
        return emp;
    });
    
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
}

function deleteDepartment(id) {
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    const departmentToDelete = departments.find(dept => dept.id === id);
    
    if (departmentToDelete) {
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const employeesInDept = employees.filter(emp => emp.department === departmentToDelete.name);
        
        if (employeesInDept.length > 0) {
            alert(`Cannot delete department. There are ${employeesInDept.length} employees assigned to this department.`);
            return;
        }
        
        const updatedDepartments = departments.filter(dept => dept.id !== id);
        
        localStorage.setItem('departments', JSON.stringify(updatedDepartments));
    }
}

function viewDepartment(id) {
    const departmentDetailsModal = document.getElementById('departmentDetailsModal');
    if (!departmentDetailsModal) {
        console.error("Department details modal not found");
        return;
    }
    
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    const department = departments.find(dept => dept.id === id);
    
    if (department) {
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const departmentEmployees = employees.filter(emp => emp.department === department.name);
        
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
        
        departmentDetailsModal.style.display = 'block';
    }
}

function openEditDepartmentForm(id) {
    const departmentModal = document.getElementById('departmentModal');
    const addDepartmentForm = document.getElementById('addDepartmentForm');
    
    if (!departmentModal || !addDepartmentForm) return;
    
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    
    const department = departments.find(dept => dept.id === id);
    
    if (department) {
        addDepartmentForm.elements['name'].value = department.name;
        addDepartmentForm.elements['description'].value = department.description;
        
        addDepartmentForm.dataset.mode = 'edit';
        addDepartmentForm.dataset.id = id;
        
        const modalTitle = departmentModal.querySelector('.form-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Department';
        }
        
        departmentModal.style.display = 'block';
    }
}

function validateDepartmentForm(departmentData) {
    if (!departmentData.name || departmentData.name.trim() === '') {
        alert('Please enter a valid department name');
        return false;
    }
    
    if (!departmentData.description || departmentData.description.trim() === '') {
        alert('Please enter a department description');
        return false;
    }
    
    return true;
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
}