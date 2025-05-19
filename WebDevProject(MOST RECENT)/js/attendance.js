document.addEventListener('DOMContentLoaded', function() {
    loadAttendance();
    setupAttendanceEvents();
});

function loadAttendance() {
    const attendanceTable = document.getElementById('attendanceTable');
    if (!attendanceTable) return;

    const datePicker = document.getElementById('attendanceDate');
    let selectedDate = new Date().toISOString().split('T')[0];

    if (datePicker) {
        selectedDate = datePicker.value || selectedDate;
    }

    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const todayAttendance = attendance.filter(a => a.date === selectedDate);
    const employees = JSON.parse(localStorage.getItem('employees')) || [];

    attendanceTable.innerHTML = '';

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

    employees.forEach(employee => {
        const record = todayAttendance.find(a => a.employeeId === employee.id);
        const row = document.createElement('tr');

        if (record) {
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

function setupAttendanceEvents() {
    const attendanceForm = document.getElementById('attendanceForm');
    const markAllPresentBtn = document.getElementById('markAllPresentBtn');
    const attendanceModal = document.getElementById('attendanceModal');
    const attendanceDate = document.getElementById('attendanceDate');
    const closeModalBtns = document.querySelectorAll('.close-btn');

    if (attendanceDate) {
        attendanceDate.valueAsDate = new Date();
        attendanceDate.addEventListener('change', function() {
            loadAttendance();
        });
    }

    if (markAllPresentBtn) {
        markAllPresentBtn.addEventListener('click', function() {
            if (confirm('Mark all employees as present for today?')) {
                markAllPresent();
                loadAttendance();
            }
        });
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            attendanceModal.style.display = 'none';
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target === attendanceModal) {
            attendanceModal.style.display = 'none';
        }
    });

    if (attendanceForm) {
        attendanceForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const attendanceData = {
                employeeId: parseInt(formData.get('employeeId')),
                date: formData.get('date'),
                timeIn: formData.get('timeIn'),
                timeOut: formData.get('timeOut'),
                status: formData.get('status')
            };

            if (!validateAttendanceForm(attendanceData)) {
                return;
            }

            const mode = this.dataset.mode;

            if (mode === 'add') {
                addAttendance(attendanceData);
            } else if (mode === 'edit') {
                const id = parseInt(this.dataset.id);
                editAttendance(id, attendanceData);
            }

            attendanceModal.style.display = 'none';
            loadAttendance();
        });
    }

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-btn') && e.target.closest('#attendanceTable')) {
            const employeeId = parseInt(e.target.dataset.employeeId);
            const date = e.target.dataset.date;
            openAddAttendanceForm(employeeId, date);
        }

        if (e.target.classList.contains('edit-btn') && e.target.closest('#attendanceTable')) {
            const id = parseInt(e.target.dataset.id);
            openEditAttendanceForm(id);
        }

        if (e.target.classList.contains('delete-btn') && e.target.closest('#attendanceTable')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Are you sure you want to delete this attendance record?')) {
                deleteAttendance(id);
                loadAttendance();
            }
        }
    });
}

function addAttendance(attendanceData) {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    attendanceData.id = generateId();
    attendance.push(attendanceData);
    localStorage.setItem('attendance', JSON.stringify(attendance));
}

function editAttendance(id, attendanceData) {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const index = attendance.findIndex(a => a.id === id);

    if (index !== -1) {
        attendance[index] = { ...attendanceData, id: id };
        localStorage.setItem('attendance', JSON.stringify(attendance));
    }
}

function deleteAttendance(id) {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const updatedAttendance = attendance.filter(a => a.id !== id);
    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
}

function openAddAttendanceForm(employeeId, date) {
    const attendanceModal = document.getElementById('attendanceModal');
    const attendanceForm = document.getElementById('attendanceForm');

    if (!attendanceModal || !attendanceForm) return;

    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const employee = employees.find(emp => emp.id === employeeId);

    if (employee) {
        attendanceForm.elements['employeeId'].value = employeeId;
        attendanceForm.elements['employeeName'].value = employee.name;
        attendanceForm.elements['date'].value = date;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        attendanceForm.elements['timeIn'].value = '08:00';
        attendanceForm.elements['timeOut'].value = '17:00';
        attendanceForm.elements['status'].value = 'Present';

        attendanceForm.dataset.mode = 'add';
        attendanceForm.dataset.id = '';

        const modalTitle = attendanceModal.querySelector('.form-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Record Attendance';
        }

        attendanceModal.style.display = 'block';
    }
}

function openEditAttendanceForm(id) {
    const attendanceModal = document.getElementById('attendanceModal');
    const attendanceForm = document.getElementById('attendanceForm');

    if (!attendanceModal || !attendanceForm) return;

    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const record = attendance.find(a => a.id === id);

    if (record) {
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const employee = employees.find(emp => emp.id === record.employeeId);

        if (employee) {
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

            attendanceForm.dataset.mode = 'edit';
            attendanceForm.dataset.id = id;

            const modalTitle = attendanceModal.querySelector('.form-header h2');
            if (modalTitle) {
                modalTitle.textContent = 'Edit Attendance Record';
            }

            attendanceModal.style.display = 'block';
        }
    }
}

function validateAttendanceForm(attendanceData) {
    if (!attendanceData.date || !attendanceData.status) {
        alert('Please fill in all required fields.');
        return false;
    }

    if (attendanceData.status === 'Present' && (!attendanceData.timeIn || !attendanceData.timeOut)) {
        alert('Time In and Time Out are required for Present status.');
        return false;
    }

    return true;
}

function markAllPresent() {
    const today = new Date().toISOString().split('T')[0];
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];

    employees.forEach(employee => {
        const recordExists = attendance.some(a => a.employeeId === employee.id && a.date === today);

        if (!recordExists) {
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

    localStorage.setItem('attendance', JSON.stringify(attendance));
}
