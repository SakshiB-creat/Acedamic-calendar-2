const apiURL = "https://script.google.com/macros/s/AKfycbzsMIwmP48TRS4eIgDHNPzgQiQysQPQdQClLVshJ2qBqWJ5qgbDTpp0dUwPv6JzfMPVUA/exec"; // Same as above

function getData(callback) {
  fetch(`${apiURL}?action=getData`)
    .then(res => res.json())
    .then(callback);
}

function addHoliday() {
  let date = document.getElementById("holidaydate").value;
  let name = document.getElementById("holidayname").value;
  fetch(`${apiURL}?action=addHoliday&date=${date}&name=${name}`).then(res=>location.reload());
}
function addEmployee() {
  let empid = document.getElementById("empid").value;
  let name = document.getElementById("empname").value;
  let email = document.getElementById("empemail").value;
  let dept = document.getElementById("empdept").value;
  let weekoff = document.getElementById("empweekoff").value;
  let username = document.getElementById("empusername").value;
  let password = document.getElementById("emppassword").value;
  fetch(`${apiURL}?action=addEmployee&employeeid=${empid}&name=${name}&email=${email}&department=${dept}&weekoff=${weekoff}&username=${username}&password=${password}`).then(res=>location.reload());
}
function addWeekOff() {
  let date = document.getElementById("cweekoffdate").value;
  let name = document.getElementById("cweekoffname").value;
  let reason = document.getElementById("cweekoffreason").value;
  fetch(`${apiURL}?action=addWeekOff&date=${date}&name=${name}&reason=${reason}`).then(res=>location.reload());
}
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
