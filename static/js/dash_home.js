document.addEventListener("DOMContentLoaded", function () {
    // 🛠️ Common Variables
    const sections = document.querySelectorAll(".dashboard-section");
    const taskInput = document.getElementById("taskInput");
    const taskList = document.getElementById("taskList");

    let selectedDueDate = "";
    let selectedReminder = "";
    let selectedRepeat = "";
    let completedTasks = 0, remainingTasks = 0;

    // 🛠️ Reset dropdowns on page load (fix for reload issue)
    resetDropdowns();

    // 🔹 Sidebar Navigation
    document.querySelector(".nav_links").addEventListener("click", function (e) {
        if (e.target.matches(".nav-item")) {
            e.preventDefault(); // prevent default anchor behavior
            let target = e.target.getAttribute("data-target");
    
            sections.forEach(section => section.classList.remove("active"));
            document.getElementById(target).classList.add("active");
    
            highlightActiveNavItem(e.target);
        }
    });
});

//login
document.getElementById("logout").addEventListener("click", function() {
    window.location.href = "/logout";  // Redirect to Flask login route
  });