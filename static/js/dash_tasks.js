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
            let target = e.target.getAttribute("data-target");

            sections.forEach(section => section.classList.remove("active"));
            document.getElementById(target).classList.add("active");

            highlightActiveNavItem(e.target);
        }
    });

    // 🔹 Highlight Active Nav Item
    function highlightActiveNavItem(activeLink) {
        const navLinks = document.querySelectorAll(".nav-item");
        navLinks.forEach(link => link.classList.remove("active"));
        activeLink.classList.add("active");
    }

    // 🔹 Dropdown Menu Functionality
    document.querySelectorAll(".dropdown-toggle").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            let dropdownId = this.getAttribute("data-dropdown");
            let dropdownMenu = document.getElementById(dropdownId);

            document.querySelectorAll(".dropdown-menu").forEach(menu => {
                if (menu !== dropdownMenu) {
                    menu.classList.remove("show");
                }
            });

            dropdownMenu.classList.toggle("show");
        });
    });

    document.addEventListener("click", function () {
        document.querySelectorAll(".dropdown-menu").forEach(menu => menu.classList.remove("show"));
    });

    document.querySelectorAll(".dropdown-menu").forEach(menu => {
        menu.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    });

    // 🔹 Handle Dropdown Selection & Update Button Labels
    document.querySelectorAll(".dropdown-menu ul li").forEach(item => {
        item.addEventListener("click", function () {
            let dropdown = this.closest(".dropdown-menu").id;
            let button = this.closest(".dropdown").querySelector(".dropdown-toggle");

            if (this.textContent.includes("Pick a date") || this.textContent.includes("Custom")) {
                let inputType = this.textContent.includes("Pick a date") ? "date" : "datetime-local";
                let inputField = document.createElement("input");
                inputField.type = inputType;
                inputField.classList.add("date-picker");

                document.body.appendChild(inputField);
                inputField.showPicker();

                inputField.addEventListener("change", function () {
                    if (this.value) {
                        let formattedDate = formatDateTime(this.value);
                        button.innerHTML = `<i class="ri-calendar-line"></i> <span>${formattedDate}</span>`;
                        button.classList.add("selected");

                        if (dropdown === "dueDropdown") {
                            selectedDueDate = formattedDate;
                        } else if (dropdown === "reminderDropdown") {
                            selectedReminder = formattedDate;
                        } else if (dropdown === "repeatDropdown") {
                            selectedRepeat = formattedDate;
                        }
                    }
                    document.body.removeChild(inputField);
                });
            } else if (this.textContent.includes("Today")) {
                const today = new Date();
                const formattedToday = today.toLocaleString();
                button.innerHTML = `<i class="ri-calendar-line"></i> <span>${formattedToday}</span>`;
                button.classList.add("selected");
                if (dropdown === "dueDropdown") {
                    selectedDueDate = formattedToday;
                } else if (dropdown === "reminderDropdown") {
                    selectedReminder = formattedToday;
                }
            } else {
                let selectedText = this.textContent.trim();
                button.innerHTML = `<i class="ri-calendar-line"></i> <span>${selectedText}</span>`;
                button.classList.add("selected");

                if (dropdown === "dueDropdown") {
                    selectedDueDate = selectedText;
                } else if (dropdown === "reminderDropdown") {
                    selectedReminder = selectedText;
                } else if (dropdown === "repeatDropdown") {
                    selectedRepeat = selectedText;
                }
            }
            this.closest(".dropdown-menu").classList.remove("show");
        });
    });

    // 🔹 Add Task
    document.getElementById("addTaskBtn").addEventListener("click", function () {
        const taskText = taskInput.value.trim();
        if (taskText === "") return;

        const taskItem = document.createElement("li");
        taskItem.classList.add("task-item");

        let dueText = selectedDueDate || "📅 Due";
        let reminderText = selectedReminder || "⏰ Reminder";
        let repeatText = selectedRepeat || "🔁 Repeat";

        taskItem.innerHTML = `
            <div class="task-details">
                <span class="task-name">${taskText}</span>
                <div class="task-meta">
                    <span class="task-due editable-field">${dueText}</span> |
                    <span class="task-reminder editable-field">${reminderText}</span> |
                    <span class="task-repeat editable-field">${repeatText}</span>
                </div>
                <button class="task-complete-btn">✅ Mark as Complete</button>
                <i class="ri-star-line task-star"></i>
                <i class="ri-delete-bin-line task-delete"></i>
            </div>
        `;

        taskList.appendChild(taskItem);
        taskInput.value = "";
        resetDropdowns();

        remainingTasks++;
        updateCounts();
    });

    taskList.addEventListener("click", function (event) {
        let target = event.target;

        if (target.classList.contains("task-name")) {
            let input = document.createElement("input");
            input.type = "text";
            input.value = target.textContent.trim();
            input.classList.add("edit-input");

            target.replaceWith(input);
            input.focus();

            function saveEdit() {
                let newTaskName = document.createElement("span");
                newTaskName.classList.add("task-name");
                newTaskName.textContent = input.value.trim() || "Untitled Task";
                input.replaceWith(newTaskName);
            }

            input.addEventListener("blur", saveEdit);
            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") saveEdit();
            });
        }

        if (target.classList.contains("editable-field")) {
            let type = target.classList.contains("task-due") ? "due" :
                target.classList.contains("task-reminder") ? "reminder" : "repeat";

            let dropdown = document.createElement("select");
            dropdown.classList.add("edit-dropdown");

            let options = {
                "due": ["Today", "Tomorrow", "Next Week", "Pick a date"],
                "reminder": ["In 1 Hour", "Later Today", "Tomorrow", "Pick a date"],
                "repeat": ["Daily", "Weekly", "Monthly", "Custom"]
            }[type];

            options.forEach(option => {
                let optionElement = document.createElement("option");
                optionElement.value = option;
                optionElement.textContent = option;
                dropdown.appendChild(optionElement);
            });

            target.replaceWith(dropdown);
            dropdown.focus();

            function saveEdit() {
                let newValue = dropdown.value;
                let newSpan = document.createElement("span");
                newSpan.classList.add("editable-field");

                if (type === "due") {
                    newSpan.textContent = `📅 ${newValue}`;
                    newSpan.classList.add("task-due");
                } else if (type === "reminder") {
                    newSpan.textContent = `⏰ ${newValue}`;
                    newSpan.classList.add("task-reminder");
                } else {
                    newSpan.textContent = `🔁 ${newValue}`;
                    newSpan.classList.add("task-repeat");
                }

                if (newValue.includes("Pick")) {
                    let input = document.createElement("input");
                    input.type = type === "due" ? "date" : type === "reminder" ? "datetime-local" : "text";
                    input.classList.add("edit-input");

                    dropdown.replaceWith(input);
                    input.focus();

                    input.addEventListener("change", function () {
                        newSpan.textContent = (type === "due" ? "📅 " : type === "reminder" ? "⏰ " : "🔁 ") + input.value;
                        input.replaceWith(newSpan);
                    });

                    input.addEventListener("blur", function () {
                        input.replaceWith(newSpan);
                    });

                    return;
                }
                dropdown.replaceWith(newSpan);
            }
            dropdown.addEventListener("change", saveEdit);
            dropdown.addEventListener("blur", saveEdit);
        }

        if (target.classList.contains("task-complete-btn")) {
            let taskItem = target.closest(".task-item");
            taskItem.classList.toggle("completed");

            if (taskItem.classList.contains("completed")) {
                target.textContent = "🔄 Undo";
                completedTasks++;
                remainingTasks--;
            } else {
                target.textContent = "✅ Mark as Complete";
                completedTasks--;
                remainingTasks++;
            }
            updateCounts();
        }

        if (target.classList.contains("task-delete")) {
            let taskItem = target.closest(".task-item");

            if (taskItem.classList.contains("completed")) {
                completedTasks--;
            } else {
                remainingTasks--;
            }

            taskItem.remove();
            updateCounts();
        }

        if (target.classList.contains("task-star")) {
            let taskItem = target.closest(".task-item");
            taskItem.classList.toggle('important-task');

            if (taskItem.classList.contains('important-task')) {
                target.classList.replace("ri-star-line", "ri-star-fill");
            } else {
                target.classList.replace("ri-star-fill", "ri-star-line");
            }
        }
    });

    function updateCounts() {
        document.getElementById("completedTasksCount").textContent = completedTasks;
        document.getElementById("remainingTasksCount").textContent = remainingTasks;
    }

    function resetDropdowns() {
        selectedDueDate = "";
        selectedReminder = "";
        selectedRepeat = "";

        document.querySelectorAll(".dropdown-toggle").forEach(button => {
            let iconClass = button.querySelector("i").className;
            button.innerHTML = `<i class="${iconClass}"></i>`;
            button.classList.remove("selected");
        });
    }

    function formatDateTime(dateTime) {
        let dateObj = new Date(dateTime);
        if (isNaN(dateObj)) return "Invalid Date";
        return dateObj.toLocaleString();
    }

    function switchTaskCategory(selectedCategory) {
        const taskHeader = document.querySelector(".todo-header h2");

        taskHeader.innerHTML = `<i class="ri-${getIcon(selectedCategory)}"></i> ${selectedCategory}`;
    }

    function getIcon(category) {
        switch (category) {
            case "My Day": return "sun-line";
            case "Important": return "star-line";
            case "Planned": return "calendar-line";
            case "Assigned to me": return "user-line";
            case "Tasks": return "checkbox-line";
            default: return "checkbox-line";
        }
    }
});
document.addEventListener("DOMContentLoaded", function () {
    function updateCurrentDate() {
        const now = new Date();
        const options = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
        const formattedDate = now.toLocaleDateString(undefined, options);
        document.getElementById("currentDate").textContent = formattedDate;
    }

    updateCurrentDate();
});