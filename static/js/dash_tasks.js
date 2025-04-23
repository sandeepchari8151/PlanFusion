document.addEventListener("DOMContentLoaded", function () {
    // 🛠️ Common Variables
    const sections = document.querySelectorAll(".dashboard-section");
    const taskInput = document.getElementById("taskInput");
    const taskList = document.getElementById("taskList");
    const navLinks = document.querySelector(".nav_links");
    const addTaskBtn = document.getElementById("addTaskBtn");

    let selectedPriority = "";
    let selectedDueDate = "";
    let selectedReminder = "";
    let selectedLabel = "";
    let completedTasks = 0, remainingTasks = 0;

    // 🛠️ Initialize page
    resetDropdowns();
    updateCurrentDate();
    fetchTasks();

    // Set up task input event listeners
    if (taskInput) {
        taskInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter" && taskInput.value.trim() !== "") {
                handleAddTask();
            }
        });
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", function() {
            if (taskInput.value.trim() !== "") {
                handleAddTask();
            }
        });
    }

    // 🔹 Sidebar Navigation
    if (navLinks) {
        navLinks.addEventListener("click", function (e) {
            if (e.target.matches(".nav-item")) {
                let target = e.target.getAttribute("data-target");
                const targetSection = document.getElementById(target);

                if (targetSection) {
                    sections.forEach(section => {
                        if (section) section.classList.remove("active");
                    });
                    targetSection.classList.add("active");
                    highlightActiveNavItem(e.target);
                }
            }
        });
    }

    // 🔹 Highlight Active Nav Item
    function highlightActiveNavItem(activeLink) {
        if (!activeLink) return;
        
        const navLinks = document.querySelectorAll(".nav-item");
        navLinks.forEach(link => {
            if (link) link.classList.remove("active");
        });
        activeLink.classList.add("active");
    }

    // 🔹 Dropdown Menu Functionality
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
    if (dropdownToggles.length > 0) {
        dropdownToggles.forEach(button => {
            button.addEventListener("click", function (event) {
                event.stopPropagation();
                let dropdownId = this.getAttribute("data-dropdown");
                let dropdownMenu = document.getElementById(dropdownId);

                if (dropdownMenu) {
                    document.querySelectorAll(".dropdown-menu").forEach(menu => {
                        if (menu && menu !== dropdownMenu) {
                            menu.classList.remove("show");
                        }
                    });

                    dropdownMenu.classList.toggle("show");
                }
            });
        });
    }

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
                        } else if (dropdown === "priorityDropdown") {
                            selectedPriority = this.textContent.trim();
                        } else if (dropdown === "labelDropdown") {
                            selectedLabel = this.textContent.trim();
                        }
                    }
                    document.body.removeChild(inputField);
                });
            } else {
                let selectedText = this.textContent.trim();
                button.innerHTML = `<i class="ri-calendar-line"></i> <span>${selectedText}</span>`;
                button.classList.add("selected");

                if (dropdown === "dueDropdown") {
                    selectedDueDate = selectedText;
                } else if (dropdown === "reminderDropdown") {
                    selectedReminder = selectedText;
                } else if (dropdown === "priorityDropdown") {
                    selectedPriority = selectedText;
                } else if (dropdown === "labelDropdown") {
                    selectedLabel = selectedText;
                }
            }
            this.closest(".dropdown-menu").classList.remove("show");
        });
    });

    // 🔹 Enhanced Task List Event Handling
    if (taskList) {
        taskList.addEventListener("click", function (event) {
            let target = event.target;
            let taskItem = target.closest(".task-item");

            if (!taskItem) return;

            // Task Checkbox
            if (target.classList.contains("task-checkbox")) {
                taskItem.classList.toggle("completed");
                updateTaskCounts();
            }

            // Task Delete
            if (target.classList.contains("delete-btn")) {
                taskItem.remove();
                updateTaskCounts();
            }
        });
    }

    // 🔹 Update Task Counts - Consolidated function
    function updateTaskCounts() {
        const totalTasks = document.querySelectorAll('.task-item').length;
        const completedTasks = document.querySelectorAll('.task-checkbox:checked').length;
        const pendingTasks = totalTasks - completedTasks;

        // Update task counts in the task list section
        const totalElement = document.querySelector('.total-tasks');
        const completedElement = document.querySelector('.completed-tasks');
        const pendingElement = document.querySelector('.pending-tasks');

        if (totalElement) totalElement.textContent = totalTasks;
        if (completedElement) completedElement.textContent = completedTasks;
        if (pendingElement) pendingElement.textContent = pendingTasks;

        // Update counts in the task header
        const completedCount = document.getElementById("completedTasksCount");
        const remainingCount = document.getElementById("remainingTasksCount");
        
        if (completedCount) completedCount.textContent = completedTasks;
        if (remainingCount) remainingCount.textContent = pendingTasks;
    }

    // 🔹 Reset Dropdowns
    function resetDropdowns() {
        selectedPriority = "";
        selectedDueDate = "";
        selectedReminder = "";
        selectedLabel = "";

        document.querySelectorAll(".dropdown-toggle").forEach(button => {
            const iconClass = button.querySelector("i").className;
            button.innerHTML = `<i class="${iconClass}"></i>`;
            button.classList.remove("selected");
        });
    }

    // 🔹 Format Date/Time
    function formatDateTime(dateTime) {
        const dateObj = new Date(dateTime);
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

    // Function to fetch tasks from the backend
    async function fetchTasks() {
        try {
            const response = await fetch('/api/dashboard/tasks');
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showNotification('Error loading tasks', 'error');
        }
    }

    // Function to add a new task
    async function addNewTask(taskData) {
        try {
            const response = await fetch('/api/dashboard/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            const newTask = await response.json();
            renderTasks([newTask], true); // true indicates append mode
            return newTask;
        } catch (error) {
            console.error('Error adding task:', error);
            showNotification('Error adding task', 'error');
            return null;
        }
    }

    // Function to update a task
    async function updateTask(taskId, updateData) {
        try {
            const response = await fetch(`/api/dashboard/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            const updatedTask = await response.json();
            renderTasks([updatedTask], false, true); // false for not append, true for update mode
            return updatedTask;
        } catch (error) {
            console.error('Error updating task:', error);
            showNotification('Error updating task', 'error');
            return null;
        }
    }

    // Function to delete a task
    async function deleteTask(taskId) {
        try {
            const response = await fetch(`/api/dashboard/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.remove();
                updateTaskCounts();
            }
            showNotification('Task deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting task:', error);
            showNotification('Error deleting task', 'error');
        }
    }

    // Function to render tasks
    function renderTasks(tasks, append = false, update = false) {
        const taskList = document.querySelector('.task-list');
        if (!taskList) return;

        if (!append && !update) {
            taskList.innerHTML = '';
        }

        tasks.forEach(task => {
            if (update) {
                const existingTask = document.querySelector(`[data-task-id="${task._id}"]`);
                if (existingTask) {
                    existingTask.replaceWith(createTaskElement(task));
                }
            } else {
                taskList.appendChild(createTaskElement(task));
            }
        });

        updateTaskCounts();
    }

    // Function to create task element
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.setAttribute('data-task-id', task._id);

        const taskContent = `
            <div class="task-content">
                <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''}>
                <span class="task-name ${task.status === 'completed' ? 'completed' : ''}">${task.name}</span>
            </div>
            <div class="task-meta">
                ${task.priority ? `<span class="task-priority ${task.priority.toLowerCase()}">${task.priority}</span>` : ''}
                ${task.due_date ? `<span class="task-due-date"><i class="fas fa-calendar"></i> ${task.due_date}</span>` : ''}
                ${task.reminder ? `<span class="task-reminder"><i class="fas fa-bell"></i> ${task.reminder}</span>` : ''}
                ${task.label ? `<span class="task-label"><i class="fas fa-tag"></i> ${task.label}</span>` : ''}
            </div>
            <div class="task-actions">
                <button class="complete-task-btn ${task.status === 'completed' ? 'completed' : ''}" title="${task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}">complete
                    <i class="fas ${task.status === 'completed' ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button class="edit-task-btn" title="Edit task">edit
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-task-btn" title="Delete task">delete
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        taskElement.innerHTML = taskContent;

        // Add event listeners
        const checkbox = taskElement.querySelector('.task-checkbox');
        const completeBtn = taskElement.querySelector('.complete-task-btn');
        
        checkbox.addEventListener('change', () => {
            const newStatus = checkbox.checked ? 'completed' : 'pending';
            updateTask(task._id, { status: newStatus });
        });

        completeBtn.addEventListener('click', () => {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            updateTask(task._id, { status: newStatus });
        });

        const deleteBtn = taskElement.querySelector('.delete-task-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this task?')) {
                deleteTask(task._id);
            }
        });

        const editBtn = taskElement.querySelector('.edit-task-btn');
        editBtn.addEventListener('click', () => {
            const taskName = taskElement.querySelector('.task-name');
            const currentName = taskName.textContent;
            taskName.innerHTML = `
                <input type="text" class="edit-input" value="${currentName}">
                <button class="save-edit-btn"><i class="fas fa-save"></i></button>
            `;
            
            const saveBtn = taskName.querySelector('.save-edit-btn');
            const editInput = taskName.querySelector('.edit-input');
            
            editInput.focus();
            
            saveBtn.addEventListener('click', () => {
                const newName = editInput.value.trim();
                if (newName) {
                    updateTask(task._id, { name: newName });
                }
            });
            
            editInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const newName = editInput.value.trim();
                    if (newName) {
                        updateTask(task._id, { name: newName });
                    }
                }
            });
        });

        return taskElement;
    }

    // Function to show notifications
    function showNotification(message, type = 'info') {
        // Implement your notification system here
        console.log(`${type}: ${message}`);
    }

    // Function to update current date
    function updateCurrentDate() {
        const now = new Date();
        const options = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
        const formattedDate = now.toLocaleDateString(undefined, options);
        const currentDateElement = document.getElementById("currentDate");
        if (currentDateElement) {
            currentDateElement.textContent = formattedDate;
        }
    }

    // Function to handle adding a new task
    async function handleAddTask() {
        const taskText = taskInput.value.trim();
        if (!taskText) return;

        const taskData = {
            name: taskText,
            status: 'pending'
        };

        // Add optional fields if they are selected
        if (selectedPriority) {
            taskData.priority = selectedPriority;
        }
        if (selectedDueDate) {
            taskData.due_date = selectedDueDate;
        }
        if (selectedReminder) {
            taskData.reminder = selectedReminder;
        }
        if (selectedLabel) {
            taskData.label = selectedLabel;
        }

        const newTask = await addNewTask(taskData);
        if (newTask) {
            taskInput.value = '';
            resetDropdowns();
            showNotification('Task added successfully', 'success');
            await fetchTasks(); // Refresh the task list
        }
    }
});