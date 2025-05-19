// Utility functions for the payroll system

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Generate unique ID
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// Add event listener for print button
function setupPrintButton() {
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
}

// Calculate date difference in days
function dateDiffInDays(date1, date2) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    
    // Convert to UTC to avoid timezone issues
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    
    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

// Check if a date is a weekend
function isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

// Calculate working days between two dates (excluding weekends)
function getWorkingDays(startDate, endDate) {
    let count = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        // Skip weekends
        if (day.getDay() !== 0 && day.getDay() !== 6) {
            count++;
        }
    }
    
    return count;
}

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Calculate years of service
function calculateYearsOfService(dateHired) {
    const hireDate = new Date(dateHired);
    const today = new Date();
    
    let years = today.getFullYear() - hireDate.getFullYear();
    const monthDiff = today.getMonth() - hireDate.getMonth();
    
    // Adjust years if hire date month hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hireDate.getDate())) {
        years--;
    }
    
    return years;
}

// Get month name from month number (0-11)
function getMonthName(monthNumber) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return months[monthNumber];
}

// Format time (e.g., 14:30 to 2:30 PM)
function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${period}`;
}

// Calculate work hours between time in and time out
function calculateWorkHours(timeIn, timeOut) {
    if (!timeIn || !timeOut) return 0;
    
    const [inHours, inMinutes] = timeIn.split(':').map(Number);
    const [outHours, outMinutes] = timeOut.split(':').map(Number);
    
    // Convert to minutes since midnight
    const inTime = inHours * 60 + inMinutes;
    const outTime = outHours * 60 + outMinutes;
    
    // Calculate difference in minutes
    let diffMinutes = outTime - inTime;
    
    // If negative, assume it's crossing midnight
    if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
    }
    
    // Convert back to hours with one decimal place
    return (diffMinutes / 60).toFixed(1);
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if value is numeric
function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}