
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");

// Get tasks from Flask and display them
async function loadTasks() {
    try {
        const response = await fetch("/api/tasks");

        if (!response.ok) {
            throw new Error("Failed to load tasks");
        }

        const tasks = await response.json();
        taskList.replaceChildren();

        if (tasks.length === 0) {
            taskList.textContent = "No tasks yet. Add your first task!";
            return;
        }

        tasks.forEach(task => {
            const card = document.createElement("div");
            card.className = "task-card";

            const title = document.createElement("h3");
            title.textContent = task.title;

            const description = document.createElement("p");
            description.textContent = task.description || "No description";

            const details = document.createElement("p");
            details.textContent =
                `Priority: ${task.priority} | Status: ${task.status}`;

            const dueDate = document.createElement("p");
            dueDate.textContent =
                `Due: ${task.due_date || "No deadline"}`;

           // Create Complete button
const completeButton = document.createElement("button");
completeButton.textContent = "Mark as Completed";

// Disable button if already completed
if (task.status === "Completed") {
    completeButton.textContent = "Completed ✓";
    completeButton.disabled = true;
}

// Update task when button is clicked
completeButton.addEventListener("click", async () => {
    try {
        const response = await fetch(`/api/tasks/${task.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "Completed"
            })
        });

        if (!response.ok) {
            throw new Error("Failed to update task");
        }

        await loadTasks();

    } catch (error) {
        console.error(error);
        alert("Could not update task.");
    }
});


const deleteButton = document.createElement("button");
deleteButton.textContent = "Delete";

deleteButton.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        const response = await fetch(`/api/tasks/${task.id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Failed to delete task");
        }

        await loadTasks();
    } catch (error) {
        console.error(error);
        alert("Could not delete task.");
    }
});

card.append(title, description, details, dueDate, completeButton, deleteButton);

            taskList.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        taskList.textContent = "Could not load tasks.";
    }
}

// Save new task
taskForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const task = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        priority: document.getElementById("priority").value,
        due_date: document.getElementById("due_date").value
    };

    try {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task)
        });

        if (!response.ok) {
            throw new Error("Failed to save task");
        }

        taskForm.reset();
        await loadTasks();

    } catch (error) {
        console.error(error);
        alert("Could not save task.");
    }
});

// Load tasks when the page opens
loadTasks();
