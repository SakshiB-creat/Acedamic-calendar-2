const apiURL = "https://script.google.com/macros/s/AKfycbzsMIwmP48TRS4eIgDHNPzgQiQysQPQdQClLVshJ2qBqWJ5qgbDTpp0dUwPv6JzfMPVUA/exec";


let holidays = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allEmployees = [];

// === Global Variables for Pagination ===
let adminCurrentLeavePage = 1;
const LEAVES_PER_PAGE = 4; // 4 notifications per page
let filteredAdminLeaves = []; // List of pending leaves to be paginated


let adminCurrentEventPage = 1;
// 🛑 IS LINE KO BADLEIN (Change this line)
const EVENTS_PER_PAGE = 5; // Har page par ab 5 events dikhenge
let filteredAdminEvents = [];


// --- NEW HELPER: Safely extracts the YYYY-MM-DD date part ---
function getCleanDate(dateInput) {
  if (!dateInput) return '';
  // If already yyyy-mm-dd string
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return String(dateInput).substring(0, 10);
    }
    // Use LOCAL getters to avoid UTC shift issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return String(dateInput).substring(0, 10);
  }
}




// --- Modal calendar nav vars
let modalCurMonth = new Date().getMonth();
let modalCurYear = new Date().getFullYear();
let currentDetailEmp = null;


window.onload = () => {
  if (localStorage.getItem("role") !== "admin") logout();

  loadAllData();

  // FIX: Corrected element ID from 'prevMoznth' to 'prevMonth'
  document.getElementById('prevMonth').onclick = () => { 
    currentMonth = (currentMonth === 0 ? 11 : currentMonth - 1);
    if(currentMonth === 11) currentYear--;
    renderCalendar(currentMonth, currentYear);
  };

  document.getElementById('nextMonth').onclick = () => {
    currentMonth = (currentMonth === 11 ? 0 : currentMonth + 1);
    if(currentMonth === 0) currentYear++;
    renderCalendar(currentMonth, currentYear);
  };
};


function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}


function formatDate(dateInput) {
  let dt = new Date(dateInput);
  let year = dt.getFullYear();
  let month = String(dt.getMonth() + 1).padStart(2, '0');
  let day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


function getData(callback) {
  fetch(`${apiURL}?action=getData`)
    .then(res => res.json())
    .then(callback)
    .catch(() => callback({ holidays: [], weekoffs: [], employees: [] }));
}


function loadAllData() {
  getData(data => {
    holidays = {};
   for(let i=1; i < data.holidays.length; i++) {
      // Use getCleanDate here!
      let cleanDate = getCleanDate(data.holidays[i][0]); 
      holidays[cleanDate] = { // FIX
        name: data.holidays[i][1],
        type: data.holidays[i][2] || "-"
      };
    }
    allEmployees = data.employees.slice(1); // Assuming first row is header
    renderCalendar(currentMonth, currentYear);
    renderEvents(data);
    loadLeaveRequests();
    renderEmployeeList();
  });
}


// Add Employee - MODIFIED
function addEmployee() {
  // 1. Get the button and details
  const btn = event.target;
  const originalText = btn.textContent;
  
  let empid = document.getElementById("empid").value;
  let name = document.getElementById("empname").value;
  let email = document.getElementById("empemail").value;
  let dept = document.getElementById("empdept").value;
  let weekoff = document.getElementById("empweekoff").value;
  let username = document.getElementById("empusername").value;
  let password = document.getElementById("emppassword").value;

  // Simple validation (ensure fields are filled)
  if (!empid || !name || !email || !dept || !weekoff || !username || !password) {
    alert("Please fill all employee details.");
    return;
  }

  // 2. Show Loader
  btn.textContent = "Loading...";
  btn.disabled = true;

  fetch(`${apiURL}?action=addEmployee&employeeid=${empid}&name=${name}&email=${email}&department=${dept}&weekoff=${weekoff}&username=${username}&password=${password}`)
    .then(res => res.json()) // Assuming the API returns a success object
    .then(json => {
      if (json.success) {
        alert("Employee added successfully! ✅");
        document.querySelector('#add-employee form').reset(); // Clear form on success
      } else {
        alert("Failed to add employee: " + (json.message || "Unknown error ❌"));
      }
      loadAllData();
    })
    .catch(err => {
      alert("Network error: " + err.message + " ❌");
      loadAllData(); // Reload data even on network error
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
}


// Add Holiday - MODIFIED
function addHoliday() {
  const btn = event.target;
  const originalText = btn.textContent;

  let date = document.getElementById("holidaydate").value;
  let name = document.getElementById("holidayname").value;
  let type = document.getElementById("holidaytype").value;
  
  if (!date || !name || !type) {
    alert("Please fill all holiday details.");
    return;
  }

  btn.textContent = "Loading...";
  btn.disabled = true;

  fetch(`${apiURL}?action=addHoliday&date=${encodeURIComponent(date)}&name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        alert("Holiday added successfully! 🎉");
        document.querySelector('#add-holiday form').reset();
      } else {
        alert("Failed to add holiday: " + (json.message || "Unknown error ❌"));
      }
      loadAllData();
    })
    .catch(err => {
      alert("Network error: " + err.message + " ❌");
      loadAllData();
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
}


// Add Custom WeekOff - MODIFIED
function addWeekOff() {
  const btn = event.target;
  const originalText = btn.textContent;

  let date = document.getElementById("cweekoffdate").value;
  let name = document.getElementById("cweekoffname").value;
  let reason = document.getElementById("cweekoffreason").value;

  if (!date || !name || !reason) {
    alert("Please fill all custom weekoff details.");
    return;
  }

  btn.textContent = "Loading...";
  btn.disabled = true;

  fetch(`${apiURL}?action=addWeekOff&date=${date}&name=${name}&reason=${reason}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        alert("Custom WeekOff added successfully! 📅");
        document.querySelector('#add-weekoff form').reset();
      } else {
        alert("Failed to add custom weekoff: " + (json.message || "Unknown error ❌"));
      }
      loadAllData();
    })
    .catch(err => {
      alert("Network error: " + err.message + " ❌");
      loadAllData();
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
}


// ------------ Calendar Render ----------------
function renderCalendar(month = currentMonth, year = currentYear) {
  const calendarDays = document.getElementById('calendarDays');
  const monthYear = document.getElementById('monthYear');
  calendarDays.innerHTML = '';
  const date = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = date.getDay();
  monthYear.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });

  for(let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.classList.add('inactive');
    calendarDays.appendChild(blank);
  }
  for(let d = 1; d <= daysInMonth; d++) {
  const cell = document.createElement('div');
  const cellDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // Basic date (always show)
  let cellContent = `<div>${d}</div>`;

  // If it is a holiday, show type (e.g. PH, CH, BDAY, WO) below date
  if(holidays[cellDate]) {
    cell.classList.add('holiday');
    cellContent += `<div class="holiday-type">${holidays[cellDate].type}</div>`;
    cell.setAttribute('title', `${holidays[cellDate].name} (${holidays[cellDate].type})`);
  }

  // Today highlight
  if(year === new Date().getFullYear() && month === new Date().getMonth() && d === new Date().getDate()) {
    cell.classList.add('today');
  }

  cell.innerHTML = cellContent;
  calendarDays.appendChild(cell);
}

// admin.js / employee.js

// Function signature update: direction ('next' ya 'prev') add karein
function renderCalendar(month, year, direction = 'none') {
    // ... existing logic ...
    
    const calendarDays = document.getElementById('calendarDays'); // Admin
    // OR
    // const calendarDays = document.getElementById('modalCalendarDays'); // Employee Modal
    
    // Naya element (container) banayein for new dates
    const newCalendarDays = document.createElement('div');
    newCalendarDays.className = 'calendar-days-inner'; // Ek naya class de dein
    
    // ... (Loop to render all 42 days) ...
    // Jahaan aap dates ko calendarDays mein append karte the, ab newCalendarDays mein append karein:
    
    // Example:
    // newCalendarDays.appendChild(cell);
    
    // ... (Loop ends) ...
    
    // 🎯 FIX 3: Animation logic
    if (direction !== 'none') {
        const currentCalendar = calendarDays.querySelector('.calendar-days-inner');
        
        if (currentCalendar) {
            // Purane calendar ko slide-out karein
            currentCalendar.classList.add('slide-out-left');
            
            // Purana calendar jab slide-out ho jaaye, toh remove karein
            setTimeout(() => {
                currentCalendar.remove();
            }, 400); // Animation duration (0.4s) se match karein
        }
        
        // Naye calendar ko slide-in karein
        if (direction === 'next') {
            newCalendarDays.classList.add('slide-in-right');
        } else if (direction === 'prev') {
            // Agar aap left se slide-in ka effect chahiye (ulta animation), 
            // toh aapko CSS mein ek 'slide-in-left' class banana hoga.
            // Filhaal hum 'slide-in-right' hi use karte hain, jo video se match karta hai.
            newCalendarDays.classList.add('slide-in-right'); 
            // Note: Video mein next aur prev dono click par naya month right se hi aata hai
        }
    }
    
    // Naye calendar ko main container mein append karein
    calendarDays.appendChild(newCalendarDays); 
    
    // ... (rest of the function) ...
}


// Iske alawa, aapko CSS mein .calendar-days-inner ko bhi style karna hoga
// Taaki woh .calendar-days ki tarah grid layout hold kare.

}


// ------------ Events Render - MODIFIED FOR BUTTON ACTIONS -----------------
// ------------ Events Render - MODIFIED FOR BUTTON ACTIONS -----------------
// ------------ Events Render - MODIFIED FOR PAGINATION -----------------
function renderEvents(data) {
    const today = getCleanDate(new Date()); 
    let allEvents = [];

    // 1. Holidays add karein
    for(let i=1; i<data.holidays.length; i++) {
        let cleanDate = getCleanDate(data.holidays[i][0]);
        
        // Sirf tabhi add karein jab event ki date aaj ya aaj ke baad ki hai
        if (cleanDate >= today) { 
            allEvents.push({
                date: cleanDate,
                name: data.holidays[i][1],
                type: data.holidays[i][2] || "-",
                isWeekOff: false // Identify as Holiday
            });
        } 
    }

    // 2. Custom WeekOffs add karein
    for(let i=1; i<data.weekoffs.length; i++) {
        let cleanDate = getCleanDate(data.weekoffs[i][0]);

        // Yahan bhi check karein ki weekoff ki date aaj ya aaj ke baad ki hai
        if (cleanDate >= today) { 
            allEvents.push({
                date: cleanDate,
                name: data.weekoffs[i][1], // Employee Name
                type: 'WO',
                isWeekOff: true // Identify as Custom WeekOff
            });
        } 
    }
    
    // Sort the events by date (if needed, though API often sends them sorted)
    allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // ✅ NAYA CODE: Store filtered data globally and reset page to 1
    filteredAdminEvents = allEvents;
    adminCurrentEventPage = 1;
    
    // Step 3: Render the first page and pagination controls
    renderEventPage(adminCurrentEventPage);
}


// --------------------------------------------------------------------------
// ✅ NAYA FUNCTION: Renders the events for the current page
// --------------------------------------------------------------------------
function renderEventPage(page) {
    const tableElement = document.getElementById("events");
    const paginationControls = document.getElementById("event-pagination-controls");
    
    if (filteredAdminEvents.length === 0) {
        tableElement.innerHTML = "<tr><th>Date</th><th>Event</th><th>Type</th><th>Action</th></tr><tr><td colspan='4'>No upcoming events.</td></tr>";
        paginationControls.innerHTML = ''; 
        return;
    }

    // Calculate start and end indices for the current page
    const totalPages = Math.ceil(filteredAdminEvents.length / EVENTS_PER_PAGE);
    const startIndex = (page - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + EVENTS_PER_PAGE;
    
    // Slice the array to get events for the current page
    const eventsForPage = filteredAdminEvents.slice(startIndex, endIndex);

    // Table Rows create karein
    let rows = eventsForPage.map(event => {
        let dateEncoded = encodeURIComponent(event.date);
        let nameEncoded = encodeURIComponent(event.name);
        let deleteButton;
        
        if (event.isWeekOff) {
            // Custom WeekOff ke liye special delete function
            deleteButton = `<button onclick="deleteEventW(event, '${dateEncoded}','${nameEncoded}')">Delete</button>`;
        } else {
            // Holiday ke liye delete function
            deleteButton = `<button onclick="deleteEvent(event, '${dateEncoded}','${nameEncoded}')">Delete</button>`;
        }
        
        return `<tr>
            <td>${event.date}</td>
            <td>${event.name}</td>
            <td>${event.type}</td>
            <td>${deleteButton}</td>
        </tr>`;
    }).join('');
    
    // Table HTML render karein
    tableElement.innerHTML = 
        "<tr><th>Date</th><th>Event</th><th>Type</th><th>Action</th></tr>" + rows;
        
    // Render Pagination Controls
    paginationControls.innerHTML = `
        <button onclick="prevEventPage()" ${page === 1 ? 'disabled' : ''}>Previous</button>
        <span>Page ${page} of ${totalPages}</span>
        <button onclick="nextEventPage()" ${page === totalPages ? 'disabled' : ''}>Next</button>
    `;
}
// --------------------------------------------------------------------------


// --------------------------------------------------------------------------
// ✅ NAYA FUNCTION: Event Pagination navigation controls
// --------------------------------------------------------------------------
function prevEventPage() {
    if (adminCurrentEventPage > 1) {
        adminCurrentEventPage--;
        renderEventPage(adminCurrentEventPage);
    }
}

function nextEventPage() {
    const totalPages = Math.ceil(filteredAdminEvents.length / EVENTS_PER_PAGE);
    if (adminCurrentEventPage < totalPages) {
        adminCurrentEventPage++;
        renderEventPage(adminCurrentEventPage);
    }
}
// --------------------------------------------------------------------------

// Delete Holiday - MODIFIED
function deleteEvent(e, date, name) {
  const btn = e.target;
  const originalText = btn.textContent;
  
  if(!confirm("Are you sure you want to delete this event?")) return;

  btn.textContent = "Deleting...";
  btn.disabled = true;

  fetch(`${apiURL}?action=deleteHoliday&date=${date}&name=${name}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        alert("Holiday deleted successfully! ✅");
        loadAllData();
      }
      else {
        alert("Failed to delete event: " + (json.message || "Unknown error ❌"));
        // Only restore button if loadAllData() wasn't called (i.e., on error)
        btn.textContent = originalText;
        btn.disabled = false;
      }
    })
    .catch(() => {
      alert("Error deleting event. ❌");
      btn.textContent = originalText;
      btn.disabled = false;
    });
}


// Delete Custom WeekOff - MODIFIED
function deleteEventW(e, date, name) {
  const btn = e.target;
  const originalText = btn.textContent;
  
  if(!confirm("Are you sure you want to delete this custom weekoff?")) return;
  
  btn.textContent = "Deleting...";
  btn.disabled = true;

  fetch(`${apiURL}?action=deleteWeekOff&date=${date}&name=${name}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        alert("Custom WeekOff deleted successfully! ✅");
        loadAllData();
      }
      else {
        alert("Failed to delete weekoff: " + (json.message || "Unknown error ❌"));
        // Only restore button if loadAllData() wasn't called (i.e., on error)
        btn.textContent = originalText;
        btn.disabled = false;
      }
    })
    .catch(() => {
      alert("Error deleting weekoff. ❌");
      btn.textContent = originalText;
      btn.disabled = false;
    });
}


// ------------ Leave Requests Render - MODIFIED FOR BUTTON ACTIONS -------------
// ------------ Leave Requests Render - MODIFIED FOR BUTTON ACTIONS -------------
// ------------ Leave Requests Render - MODIFIED FOR BUTTON ACTIONS -------------
// Function to fetch and render leave requests
// Function to fetch and render leave requests
// ... (existing functions like undoLeave, renderEmployeeList, etc.)

// ------------ Leave Requests Render - MODIFIED FOR BUTTON ACTIONS -------------
// Function to fetch and render leave requests
// ... (existing functions like undoLeave, renderEmployeeList, etc.)

// ------------ Leave Requests Render - MODIFIED FOR RECENCY -------------
// Function to fetch and render leave requests
// REPLACE your current loadLeaveRequests() with this:
// ------------ Leave Requests Render - MODIFIED FOR PAGINATION -------------
function loadLeaveRequests() {
    fetch(`${apiURL}?action=getAllLeaves`)
        .then(res => res.json())
        .then(data => {
            
            // Step 1: Filtering logic (Same as before).
            let relevantLeaves = data.filter(leave => 
                // Filter sabhi Pending, Approved, aur Rejected requests
                leave[5] === "Pending" || leave[5] === "Approved" || leave[5] === "Rejected"
            );

            // Reverse logic (Newest requests first).
            relevantLeaves.reverse();
            
            // ❌ Purani rendering logic hata di hai (jo 'rows' bana rahi thi)
            
            // ✅ NAYA CODE: Filtered data ko global variable mein store karein aur page 1 par set karein
            filteredAdminLeaves = relevantLeaves;
            adminCurrentLeavePage = 1;
            
            // Step 2: Render the first page and pagination controls
            renderLeavePage(adminCurrentLeavePage);

        });
}

// --------------------------------------------------------------------------
// ✅ NAYA FUNCTION: Renders the leaves for the current page
// --------------------------------------------------------------------------
function renderLeavePage(page) {
    const container = document.getElementById("leave-requests-list");
    const tableElement = document.getElementById("admin-leave-requests");
    const paginationControls = document.getElementById("leave-pagination-controls");
    
    if (filteredAdminLeaves.length === 0) {
        container.style.display = 'none';
        paginationControls.innerHTML = ''; // Controls bhi hata do
        return;
    }

    container.style.display = 'block'; 

    // Calculate start and end indices for the current page
    const totalPages = Math.ceil(filteredAdminLeaves.length / LEAVES_PER_PAGE);
    const startIndex = (page - 1) * LEAVES_PER_PAGE;
    const endIndex = startIndex + LEAVES_PER_PAGE;
    
    // Slice the array to get leaves for the current page (Pagination ka main logic)
    const leavesForPage = filteredAdminLeaves.slice(startIndex, endIndex);

    // Step 3: Table Rows create karein (Purani logic, ab 'leavesForPage' use ho raha hai)
    let rows = leavesForPage.map(leave => {
        const leaveDate = leave[4].substring(0, 10);
        const status = leave[5]; // Current status

        const statusBadge = `<span class="status-badge status-${status}">${status}</span>`;
        
        let actionButtons;
        
        if (status === "Pending") {
            actionButtons = `<button class="approve-btn" onclick="approveLeave(event, '${leave[0]}','${leaveDate}')">Approve</button>
                             <button class="reject-btn" onclick="rejectLeave(event, '${leave[0]}','${leaveDate}')">Reject</button>`;
        } else {
            actionButtons = `<button class="undo-btn" onclick="undoLeave(event, '${leave[0]}','${leaveDate}')">Undo</button>`;
        }

        return `<tr>
            <td>${leave[1]}</td>
            <td>${leave[3]}</td>
            <td>${leaveDate}</td>
            <td>${statusBadge}</td>
            <td>${actionButtons}</td>
        </tr>`;
    }).join('');
    
    // Step 4: Table HTML render karein
    tableElement.innerHTML = 
        `<thead>
            <tr><th>Name</th><th>Type</th><th>Date</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>`;
        
    // Step 5: Render Pagination Controls
    paginationControls.innerHTML = `
        <button onclick="prevLeavePage()" ${page === 1 ? 'disabled' : ''}>Previous</button>
        <span>Page ${page} of ${totalPages}</span>
        <button onclick="nextLeavePage()" ${page === totalPages ? 'disabled' : ''}>Next</button>
    `;
}
// --------------------------------------------------------------------------


// --------------------------------------------------------------------------
// ✅ NAYA FUNCTION: Pagination navigation controls
// --------------------------------------------------------------------------
function prevLeavePage() {
    if (adminCurrentLeavePage > 1) {
        adminCurrentLeavePage--;
        renderLeavePage(adminCurrentLeavePage);
    }
}

function nextLeavePage() {
    const totalPages = Math.ceil(filteredAdminLeaves.length / LEAVES_PER_PAGE);
    if (adminCurrentLeavePage < totalPages) {
        adminCurrentLeavePage++;
        renderLeavePage(adminCurrentLeavePage);
    }
}
// --------------------------------------------------------------------------




// ... (rest of the code)
// ... (rest of the code)
// Helper function to handle button loading state
function handleLeaveAction(e, action, id, date, successMsg) {
  const btn = e.target;
  const originalText = btn.textContent;
  
  // Disable all buttons in the same cell while one is processing
  const actionCell = btn.parentElement;
  Array.from(actionCell.children).forEach(b => b.disabled = true);
  btn.textContent = "Loading...";

  fetch(`${apiURL}?action=${action}Leave&id=${id}&date=${date}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        alert(successMsg + " ✅");
        loadLeaveRequests();
      } else {
        alert(`Operation failed: ${json.message || "Unknown error"} ❌`);
        loadLeaveRequests(); // Still refresh in case of partial update
      }
    })
    .catch(err => {
      alert("Network error: " + err.message + " ❌");
      // Restore buttons manually on network error since loadLeaveRequests won't run
      Array.from(actionCell.children).forEach(b => b.disabled = false);
      btn.textContent = originalText;
    });
}


// Approve Leave - MODIFIED
function approveLeave(e, id, date) {
  handleLeaveAction(e, 'approve', id, date, "Leave approved successfully");
}


// Reject Leave - MODIFIED
function rejectLeave(e, id, date) {
  handleLeaveAction(e, 'reject', id, date, "Leave rejected successfully");
}


// Undo Leave - MODIFIED
function undoLeave(e, id, date) {
  handleLeaveAction(e, 'undo', id, date, "Leave status reverted successfully");
}


// ----- New: Employee list with search and modal details -------


function renderEmployeeList() {
  const empList = document.getElementById("employeeList");
  empList.innerHTML = "";
  allEmployees.forEach(emp => {
    let li = document.createElement("li");
    li.textContent = `${emp[1]} (${emp[0]})`; // Name (ID)
    li.style.cursor = "pointer";
    li.onclick = () => showEmployeeDetails(emp);
    empList.appendChild(li);
  });
}


function filterEmployees() {
  let searchVal = document.getElementById("empSearch").value.toLowerCase();
  const empList = document.getElementById("employeeList");
  empList.innerHTML = "";
  allEmployees.filter(emp => 
    emp[1].toLowerCase().includes(searchVal) || emp[0].toLowerCase().includes(searchVal)
  ).forEach(emp => {
    let li = document.createElement("li");
    li.textContent = `${emp[1]} (${emp[0]})`;
    li.style.cursor = "pointer";
    li.onclick = () => showEmployeeDetails(emp);
    empList.appendChild(li);
  });
}

// --- UPDATED function in admin.js ---
function showEmployeeDetails(emp) {
    currentDetailEmp = emp;
    modalCurMonth = new Date().getMonth();
    modalCurYear = new Date().getFullYear();

    document.getElementById("modalEmpName").textContent = emp[1];
    document.getElementById("modalEmpId").textContent = emp[0];
    document.getElementById("modalEmpEmail").textContent = emp[2];
    document.getElementById("modalEmpDept").textContent = emp[3];
    document.getElementById("modalEmpWeekOff").textContent = emp[4];

    function renderCalendarForMonth() {
        getEmployeeApprovedLeaves(emp[0], modalCurMonth, modalCurYear, function(approvedLeaves){
            renderEmployeeCalendarModal(emp, modalCurMonth, modalCurYear, approvedLeaves);
            document.getElementById("modalMonthYear").textContent =
                new Date(modalCurYear, modalCurMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
        });
    }
    renderCalendarForMonth();

    document.getElementById("modalPrevMonth").onclick = () => {
        modalCurMonth--;
        if (modalCurMonth < 0) {
            modalCurMonth = 11;
            modalCurYear--;
        }
        renderCalendarForMonth();
    };

    document.getElementById("modalNextMonth").onclick = () => {
        modalCurMonth++;
        if (modalCurMonth > 11) {
            modalCurMonth = 0;
            modalCurYear++;
        }
        renderCalendarForMonth();
    };

    document.getElementById('prevMonth').addEventListener('click', () => {
    // ... month/year logic ...
    renderCalendar(currentMonth, currentYear, 'prev'); // Direction 'prev' pass karein
});

document.getElementById('nextMonth').addEventListener('click', () => {
    // ... month/year logic ...
    renderCalendar(currentMonth, currentYear, 'next'); // Direction 'next' pass karein
});

    // --- ANIMATION LOGIC: Display and then add 'show' class ---
    const modal = document.getElementById("employeeModal");
    modal.style.display = "flex"; // Modal ko pehle visible banao
    
    // Thoda sa delay do taki browser 'display: flex' ko register kar le
    setTimeout(() => {
        modal.classList.add("show"); // Ab animation shuru karo
    }, 10);
    // --- END ANIMATION LOGIC ---
}


function renderEmployeeCalendarModal(emp, month, year, approvedLeaves=[]) {
  const calendarDays = document.getElementById('modalEmpCalendar');
  calendarDays.innerHTML = '';
  const date = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = date.getDay();

  for(let i=0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.classList.add('inactive');
    calendarDays.appendChild(blank);
  }
  for(let d=1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    let dt = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cell.textContent = d;

    if(year === new Date().getFullYear() && month === new Date().getMonth() && d === new Date().getDate()) {
      cell.classList.add('today');
    }
    if(holidays[dt]) {
      cell.classList.add('holiday');
      cell.title = `${holidays[dt].name} (${holidays[dt].type})`;
    }
    let weekdayName = new Date(dt).toLocaleString('en-US', {weekday: 'long'});
    if(weekdayName === emp[4]) {
      cell.classList.add('weekoff');
      cell.title = `Standard Week Off (${emp[4]})`;
    }
    if(approvedLeaves.includes(dt)){
      cell.classList.add('leave');
      cell.title = "Leave Approved";
    }
    calendarDays.appendChild(cell);
  }
}




function getEmployeeApprovedLeaves(empId, month, year, callback) {
  fetch(`${apiURL}?action=getLeaves&id=${empId}`)
    .then(res => res.json())
    .then(leaves => {
      // Only Approved Leaves, and same month/year
      let approved = leaves.filter(l =>
        l[5] === "Approved" &&
        new Date(l[4]).getMonth() === month &&
        new Date(l[4]).getFullYear() === year
      ).map(l => l[4].substring(0,10));
      callback(approved);
    });
}




// --- UPDATED function in admin.js ---
function closeEmployeeModal() {
    const modal = document.getElementById("employeeModal");
    
    // 1. 'show' class ko hatao (removes the opacity: 1 and transform: scale(1))
    modal.classList.remove("show");
    
    // 2. 400ms (0.4s) ka wait karo jab tak transition complete na ho jaye
    setTimeout(() => {
        // 3. Phir modal ko display: none kar do
        modal.style.display = "none";
    }, 400); 
}