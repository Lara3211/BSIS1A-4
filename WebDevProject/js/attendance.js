document.addEventListener('DOMContentLoaded', function() {
    // Load attendance data
    loadAttendance();
    
    // Set up event listeners
    setupAttendanceEvents();
});

// Load attendance from localStorage
function loadAttendance() {
    const attendanceTable = document.getElementById('attendanceTable');
    if (!attendanceTable) return;
    
    // Get selected date from date picker, or use today's date
    const datePicker = document.getElementById('attendanceDate');
    let selectedDate = new Date().toISOString().split('T')[0]; // Default to today
    
    if (datePicker) {
        selectedDate = datePicker.value || selectedDate;
    }
    
    // Get attendance data for selected date
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const todayAttendance = attendance.filter(a => a.date === selectedDate);
    
    // Get employees data
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Clear existing table rows
    attendanceTable.innerHTML = '';
    
    // Add table header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Employee</th>
        <th>Department</th>
        <th>Time In</th>
        <th>Time Out</th>
        <th>Status</th>
        <th>Actions</th>
    `;
    attendanceTable.appendChild(headerRow);
    
    // Add table rows for each employee
    employees.forEach(employee => {
        // Find attendance record for this employee on selected date
        const record = todayAttendance.find(a => a.employeeId === employee.id);
        
        const row = document.createElement('tr');
        
        if (record) {
            // Attendance record exists
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${employee.department}</td>
                <td>${record.timeIn || '-'}</td>
                <td>${record.timeOut || '-'}</td>
                <td>${record.status}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${record.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${record.id}">Delete</button>
                </td>
            `;
        } else {
            // No attendance record
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${employee.department}</td>
                <td>-</td>
                <td>-</td>
                <td>Absent</td>
                <td>
                    <button class="action-btn view-btn" data-employee-id="${employee.id}" data-date="${selectedDate}">Record</button>
                </td>
            `;
        }
        
        attendanceTable.appendChild(row);
    });
}

// Set up event listeners for attendance actions
function setupAttendanceEvents() {
    // Get form and buttons
    const attendanceForm = document.getElementById('attendanceForm');
    const markAllPresentBtn = document.getElementById('markAllPresentBtn');
    const attendanceModal = document.getElementById('attendanceModal');
    const attendanceDate = document.getElementById('attendanceDate');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    
    // Date picker change event
    if (attendanceDate) {
        // Set default value to today
        attendanceDate.valueAsDate = new Date();
        
        attendanceDate.addEventListener('change', function() {
            loadAttendance();
        });
    }
    
    // Mark all present button event
    if (markAllPresentBtn) {
        markAllPresentBtn.addEventListener('click', function() {
            if (confirm('Mark all employees as present for today?')) {
                markAllPresent();
                loadAttendance();
            }
        });
    }
    
    // Close modal buttons event
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            attendanceModal.style.display = 'none';
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target === attendanceModal) {
            attendanceModal.style.display = 'none';
        }
    });
    
    // Form submit event
    if (attendanceForm) {
        attendanceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const attendanceData = {
                employeeId: parseInt(formData.get('employeeId')),
                date: formData.get('date'),
                timeIn: formData.get('timeIn'),
                timeOut: formData.get('timeOut'),
                status: formData.get('status')
            };
            
            // Validate form data
            if (!validateAttendanceForm(attendanceData)) {
                return;
            }
            
            // Get mode (add or edit)
            const mode = this.dataset.mode;
            
            if (mode === 'add') {
                // Add new attendance record
                addAttendance(attendanceData);
            } else if (mode === 'edit') {
                // Edit existing attendance record
                const id = parseInt(this.dataset.id);
                editAttendance(id, attendanceData);
            }
            
            // Hide modal
            attendanceModal.style.display = 'none';
            
            // Reload attendance
            loadAttendance();
        });
    }
    
    // Delegate click events for action buttons
    document.addEventListener('click', function(e) {
        // Record button (same as view-btn for consistency with other pages)
        if (e.target.classList.contains('view-btn') && e.target.closest('#attendanceTable')) {
            const employeeId = parseInt(e.target.dataset.employeeId);
            const date = e.target.dataset.date;
            openAddAttendanceForm(employeeId, date);
        }
        
        // Edit button
        if (e.target.classList.contains('edit-btn') && e.target.closest('#attendanceTable')) {
            const id = parseInt(e.target.dataset.id);
            openEditAttendanceForm(id);
        }
        
        // Delete button
        if (e.target.classList.contains('delete-btn') && e.target.closest('#attendanceTable')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Are you sure you want to delete this attendance record?')) {
                deleteAttendance(id);
                loadAttendance();
            }
        }
    });
}

// Add new attendance record
function addAttendance(attendanceData) {
    // Get existing attendance
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // Add ID to new attendance record
    attendanceData.id = generateId();
    
    // Add to array
    attendance.push(attendanceData);
    
    // Save to localStorage
    localStorage.setItem('attendance', JSON.stringify(attendance));
}

// Edit attendance record
function editAttendance(id, attendanceData) {
    // Get existing attendance
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // Find attendance index
    const index = attendance.findIndex(a => a.id === id);
    
    if (index !== -1) {
        // Update attendance data, preserving the ID
        attendance[index] = { ...attendanceData, id: id };
        
        // Save to localStorage
        localStorage.setItem('attendance', JSON.stringify(attendance));
    }
}

// Delete attendance record
function deleteAttendance(id) {
    // Get existing attendance
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // Filter out the attendance to delete
    const updatedAttendance = attendance.filter(a => a.id !== id);
    
    // Save to localStorage
    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
}

// Open add attendance form
function openAddAttendanceForm(employeeId, date) {
    // Get attendance modal and form
    const attendanceModal = document.getElementById('attendanceModal');
    const attendanceForm = document.getElementById('attendanceForm');
    
    if (!attendanceModal || !attendanceForm) return;
    
    // Get employee details
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (employee) {
        // Set form fields
        attendanceForm.elements['employeeId'].value = employeeId;
        attendanceForm.elements['employeeName'].value = employee.name;
        attendanceForm.elements['date'].value = date;
        
        // Set default times
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        attendanceForm.elements['timeIn'].value = '08:00';
        attendanceForm.elements['timeOut'].value = '17:00';
        attendanceForm.elements['status'].value = 'Present';
        
        // Set form mode to add
        attendanceForm.dataset.mode = 'add';
        attendanceForm.dataset.id = '';
        
        // Update modal title
        const modalTitle = attendanceModal.querySelector('.form-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Record Attendance';
        }
        
        // Show modal
        attendanceModal.style.display = 'block';
    }
}

// Open edit attendance form
function openEditAttendanceForm(id) {
    // Get attendance modal and form
    const attendanceModal = document.getElementById('attendanceModal');
    const attendanceForm = document.getElementById('attendanceForm');
    
    if (!attendanceModal || !attendanceForm) return;
    
    // Get existing attendance
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // Find attendance record
    const record = attendance.find(a => a.id === id);
    
    if (record) {
        // Get employee details
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const employee = employees.find(emp => emp.id === record.employeeId);
        
        if (employee) {
            // Set form fields
            attendanceForm.elements['employeeId'].value = record.employeeId;
            attendanceForm.elements['employeeName'].value = employee.name;
            attendanceForm.elements['date'].value = record.date;

            const displayDate = document.getElementById('attendanceDisplayDate');
            if (displayDate) {
            displayDate.value = record.date;
            }
            
            attendanceForm.elements['timeIn'].value = record.timeIn;
            attendanceForm.elements['timeOut'].value = record.timeOut;
            attendanceForm.elements['status'].value = record.status;
            
            // Set form mode to edit
            attendanceForm.dataset.mode = 'edit';
            attendanceForm.dataset.id = id;
            
            // Update modal title
            const modalTitle = attendanceModal.querySelector('.form-header h2');
            if (modalTitle) {
                modalTitle.textContent = 'Edit Attendance Record';
            }
            
            // Show modal
            attendanceModal.style.display = 'block';
        }
    }
}

// Validate attendance form
function validateAttendanceForm(attendanceData) {
    // Check required fields
    if (!attendanceData.date || !attendanceData.status) {
        alert('Please fill in all required fields.');
        return false;
    }
    
    // If status is Present, time in and time out are required
    if (attendanceData.status === 'Present' && (!attendanceData.timeIn || !attendanceData.timeOut)) {
        alert('Time In and Time Out are required for Present status.');
        return false;
    }
    
    return true;
}

// Mark all employees as present for today
function markAllPresent() {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get employees
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // Get existing attendance
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // For each employee, add attendance record if not exists
    employees.forEach(employee => {
        // Check if record already exists
        const recordExists = attendance.some(a => a.employeeId === employee.id && a.date === today);
        
        if (!recordExists) {
            // Add new attendance record
            const newRecord = {
                id: generateId(),
                employeeId: employee.id,
                date: today,
                timeIn: '08:00',
                timeOut: '17:00',
                status: 'Present'
            };
            
            attendance.push(newRecord);
        }
    });
    
    // Save to localStorage
    localStorage.setItem('attendance', JSON.stringify(attendance));
}