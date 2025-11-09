console.log("role:", localStorage.getItem("role"));
console.log("emp:", localStorage.getItem("emp"));


let empHolidays = [];
let empWeekOffs = [];
let empCurrentMonth = new Date().getMonth();
let empCurrentYear = new Date().getFullYear();
let empApprovedLeaves = [];
// admin.js

// === Global Variables for Pagination ===
let adminCurrentLeavePage = 1;
const LEAVES_PER_PAGE = 4; // 4 notifications per page
let filteredAdminLeaves = []; // List of pending leaves to be paginated
// ======================================



// ... existing code ...

// --- NEW HELPER: Safely extracts the YYYY-MM-DD date part ---
function getCleanDate(dateInput) {
    if (!dateInput) return '';
    // ... existing logic ...
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) {
            return String(dateInput).substring(0, 10);
        }
        // Use LOCAL getters to avoid UTC shift issues
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`; // Returns YYYY-MM-DD format
    } catch (e) {
        return String(dateInput).substring(0, 10);
    }
}


window.onload = () => {
    // Check role and load data
    if (localStorage.getItem("role") !== "employee") logout();

    const emp = JSON.parse(localStorage.getItem("emp"));

    if (!emp || !emp[0]) {
        return logout(); // Employee data missing, stop and log out
    }
    
    // 1. Employee ke liye aaj ki date set karna
    const today = getCleanDate(new Date());
    document.getElementById('leave-date').value = today;

    // 2. Auto-fill and Display Employee details
    document.getElementById("emp-name").textContent = emp[1];
    document.getElementById("leave-id").value = emp[0];
    document.getElementById("leave-name").value = emp[1];
    document.getElementById("leave-email").value = emp[2];
    document.getElementById("leave-id").readOnly = true;
    document.getElementById("leave-name").readOnly = true;
    document.getElementById("leave-email").readOnly = true;

    // 3. 🔑 KEY FIX: Load Data and Render Calendar (Asynchronously)
    loadEmployeeData(emp, () => {
        // Data has loaded from API (Holidays, Custom Weekoffs are set)
        
        // Render other components first
        renderEmployeeEvents();
        renderEmployeeLeaves(emp[0]);
        
        // 🎯 Finally, render the calendar with the loaded data
        renderEmployeeCalendar(emp); 
    });


    // 4. Calendar navigation listeners (These must be defined after IDs are loaded)
    document.getElementById('empPrevMonth').onclick = () => {
        empCurrentMonth--;
        if(empCurrentMonth < 0) {
            empCurrentMonth = 11;
            empCurrentYear--;
        }
        renderEmployeeCalendar(emp, empCurrentMonth, empCurrentYear); // Use 'emp' from closure
    };

    document.getElementById('empNextMonth').onclick = () => {
        empCurrentMonth++;
        if(empCurrentMonth > 11) {
            empCurrentMonth = 0;
            empCurrentYear++;
        }
        renderEmployeeCalendar(emp, empCurrentMonth, empCurrentYear); // Use 'emp' from closure
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

function loadEmployeeData(emp, callback) {
  getData(data => {
    empHolidays = [];
    for(let i=1;i<data.holidays.length;i++) {
      empHolidays.push({
        date: getCleanDate(data.holidays[i][0]), // Use getCleanDate here too
        name: data.holidays[i][1],
        type: data.holidays[i][2]
      });
    }
    empWeekOffs = [];
    for(let i=1;i<data.weekoffs.length;i++) {
      if(data.weekoffs[i][1] === emp[1]) {
        empWeekOffs.push({
          date: getCleanDate(data.weekoffs[i][0]), // Use getCleanDate here too
          reason: data.weekoffs[i][2]
        });
      }
    }
    if(callback) callback();
  });
}

function renderEmployeeEvents() {
  let rows = [];
  // --- NAYI LINE ---
  // Aaj ki date ko YYYY-MM-DD format mein prapt karein
  const today = getCleanDate(new Date()); 

  for(let h of empHolidays) {
    // --- NAYA IF CONDITION ---
    // Sirf tabhi row add karein jab event ki date aaj ya aaj ke baad ki hai
    if (h.date >= today) { 
      rows.push(`<tr><td>${h.date}</td><td>${h.name}</td><td>${h.type || '-'}</td></tr>`);
    } // --- NAYA IF CONDITION END ---
  }

  for(let w of empWeekOffs) {
    // --- NAYA IF CONDITION ---
    // Yahan bhi check karein ki weekoff ki date aaj ya aaj ke baad ki hai
    if (w.date >= today) { 
      rows.push(`<tr><td>${w.date}</td><td>Week Off</td><td>${w.reason || '-'}</td></tr>`);
    } // --- NAYA IF CONDITION END ---
  }

  document.getElementById("emp-events").innerHTML =
    "<tr><th>Date</th><th>Event</th><th>Type</th></tr>" + rows.join('');
}
// --- ✅ MODIFIED: Simple and Fixed Calendar Render Logic ---
function renderEmployeeCalendar(emp, month = empCurrentMonth, year = empCurrentYear) {
    const calendarDays = document.getElementById('empCalendarDays');
    const monthYear = document.getElementById('empMonthYear');
    calendarDays.innerHTML = ''; // Clear existing content

    const date = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = date.getDay();

    // 1. Month/Year Header Update
    monthYear.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    // 2. Blank days
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.classList.add('inactive');
        calendarDays.appendChild(blank);
    }

    // 3. Render actual dates
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        let dt = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        let cellContent = `<div>${d}</div>`;

        // Holidays
        let holiday = empHolidays.find(h => h.date === dt);
        if (holiday) {
            cell.classList.add('holiday');
            cellContent += `<div class="holiday-type">${holiday.type}</div>`;
            cell.setAttribute('title', `${holiday.name} (${holiday.type || '-'})`);
        }

        // Specific Week Offs (Overlaps with standard week-off if both exist)
        let weekOffDay = empWeekOffs.find(w => w.date === dt);
        if (weekOffDay) {
            cell.classList.add('weekoff');
            cell.setAttribute('title', `Week Off (${weekOffDay.reason || '-'})`);
        }
        
        // Standard Week Off (e.g., Saturday)
        if (emp[4]) {
            let cellDay = new Date(dt).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
            let empWeekOffDay = emp[4].trim().toLowerCase();
            if (cellDay === empWeekOffDay) {
                cell.classList.add('weekoff');
                cell.setAttribute('title', `Standard Week Off (${emp[4]})`);
            }
        }
        
        // Approved Leaves
        if (empApprovedLeaves && empApprovedLeaves.includes(dt)) {
            cell.classList.add('leave');
            cell.setAttribute('title', `Leave Approved`);
        }
        
        // Today highlight
        if (year === new Date().getFullYear() && month === new Date().getMonth() && d === new Date().getDate()) {
            cell.classList.add('today');
        }
        
        cell.innerHTML = cellContent;
        calendarDays.appendChild(cell);
    }
}

function applyLeave() {
  let emp = JSON.parse(localStorage.getItem("emp"));
  let id = document.getElementById("leave-id").value;
  let name = document.getElementById("leave-name").value;
  let email = document.getElementById("leave-email").value;
  let date = document.getElementById("leave-date").value.substring(0,10); // Should be YYYY-MM-DD
  let type = document.getElementById("leave-type").value;
  fetch(`${apiURL}?action=applyLeave&id=${id}&name=${name}&email=${email}&date=${date}&type=${type}`)
    .then(res => res.json())
    .then(json => {
      document.getElementById("leave-msg").textContent = json.message;
      if(json.success) {
        renderEmployeeLeaves(id);
        document.getElementById("leave-date").value = '';
        document.getElementById("leave-type").value = '';
      }
    });
}


// --- MODIFIED: Uses getCleanDate to correctly format the date from the API response ---
// --- ✅ FINAL FIX: renderEmployeeLeaves ---
function renderEmployeeLeaves(empId) {
    fetch(`${apiURL}?action=getLeaves&id=${empId}`)
        .then(res => res.json())
        .then(leaves => {
            let rows = leaves.map(leave => {
                // leave[3]: Type, leave[4]: Date, leave[5]: Status
                const leaveDate = getCleanDate(leave[4]);
                const statusClass = leave[5].toLowerCase();
                
                // 🎯 FIX: HTML table row with correct columns (Type, Date, Status)
                return `<tr class="${statusClass}"><td>${leave[3]}</td><td>${leaveDate}</td><td>${leave[5]}</td></tr>`;
                
            }).join('');
            
            // Re-generate the full table HTML
            const tableHTML = `
                <h3><span style="font-size:1.3rem;">&#128196;</span> Your Leave Applications</h3>
                <table id="emp-leaves-list">
                    <tr><th>Type</th><th>Date</th><th>Status</th></tr>
                    ${rows}
                </table>
            `;
            
            // Insert the table into the dedicated DIV
            document.getElementById("emp-leave-table").innerHTML = tableHTML;
            
            // 🎯 CRITICAL: Update Approved Leaves and Re-render Calendar
            empApprovedLeaves = leaves.filter(leave => leave[5] === "Approved").map(leave => getCleanDate(leave[4]));
            
            // Calendar ko hamesha yahan call karein, data load hone ke baad!
            renderEmployeeCalendar(JSON.parse(localStorage.getItem("emp")), empCurrentMonth, empCurrentYear);
            
        })
        .catch(error => {
            // Error handling: Agar leaves load nahi hui, tab bhi calendar ko load karein
            console.error("Error loading employee leaves:", error);
            // Agar API fail ho jaye to bhi calendar dikhe
            document.getElementById("emp-leave-table").innerHTML = "<h3><span style='font-size:1.3rem;'>&#128196;</span> Your Leave Applications</h3><p>Could not load leave data. Please check connection.</p>";
            renderEmployeeCalendar(JSON.parse(localStorage.getItem("emp")), empCurrentMonth, empCurrentYear);
        });
}