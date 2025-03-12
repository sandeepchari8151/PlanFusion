document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}


function addTask() {
    const taskInput = document.getElementById("taskInput");
    const taskDate = document.getElementById("taskDate").value;
    const priority = document.getElementById("priority").value;
    
    if (taskInput.value.trim() === "" || taskDate === "") {
        alert("Please enter a task and select a date!");
        return;
    }

    const task = {
        text: taskInput.value,
        date: taskDate,
        priority: priority
    };

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    taskInput.value = "";
    document.getElementById("taskDate").value = "";
    displayTasks();
}

function displayTasks() {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.innerHTML = `${task.text} - <strong>${task.date}</strong> (<em>${task.priority}</em>) 
                        <button onclick="deleteTask(${index})">❌</button>`;
        li.style.padding = "10px";
        li.style.borderBottom = "1px solid #ddd";
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        taskList.appendChild(li);
    });
}

function deleteTask(index) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.splice(index, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    displayTasks();
}

function loadTasks() {
    displayTasks();
}