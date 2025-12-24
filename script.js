document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const priorityInput = document.getElementById('priority-input');
    const dateInput = document.getElementById('date-input');
    const taskList = document.getElementById('task-list');
    const searchInput = document.getElementById('search-input');
    const pendingCount = document.getElementById('pending-count');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const notifyBtn = document.getElementById('notify-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const submitBtn = taskForm.querySelector('.add-btn');
    
    const popup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupClose = document.getElementById('popup-close');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let editingTaskId = null;

    // Theme Logic
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Request Notification Permission
    notifyBtn.addEventListener('click', () => {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
        } else if (Notification.permission === "denied") {
            alert("Notifications are blocked. Please enable them in your browser settings.");
        } else {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("Notifications Enabled", {
                        body: "You will be reminded of your tasks!",
                    });
                    notifyBtn.style.display = 'none';
                }
            });
        }
    });

    // Hide notify button if already granted
    if (Notification.permission === 'granted') {
        notifyBtn.style.display = 'none';
    }

    // Add Task
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (editingTaskId) {
            // Update existing task
            tasks = tasks.map(task => {
                if (task.id === editingTaskId) {
                    return {
                        ...task,
                        text: taskInput.value,
                        priority: priorityInput.value,
                        dueDate: dateInput.value,
                        notified: false // Reset notification for updated time
                    };
                }
                return task;
            });
            editingTaskId = null;
            submitBtn.textContent = 'Add Task';
        } else {
            // Add new task
            tasks.push({
                id: Date.now(),
                text: taskInput.value,
                priority: priorityInput.value,
                dueDate: dateInput.value,
                completed: false,
                notified: false
            });
        }
        
        saveAndRender();
        taskForm.reset();
        // Reset date to empty or default if needed
    });

    // Search Filter
    searchInput.addEventListener('input', renderTasks);

    // Render Tasks
    function renderTasks() {
        taskList.innerHTML = '';
        const searchQuery = searchInput.value.toLowerCase();
        
        const filteredTasks = tasks.filter(task => 
            task.text.toLowerCase().includes(searchQuery)
        );

        // Sort: Incomplete first, then by date
        const sortedTasks = [...filteredTasks].sort((a, b) => {
            if (a.completed === b.completed) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            return a.completed ? 1 : -1;
        });

        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            const priorityColor = getPriorityColor(task.priority);
            const formattedDate = new Date(task.dueDate).toLocaleString([], { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });

            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <div class="task-meta">
                        <span class="priority-badge" style="background-color: ${priorityColor}"></span>
                        <span class="priority-text">${capitalize(task.priority)}</span>
                        <span>•</span>
                        <span>Due: ${formattedDate}</span>
                    </div>
                </div>
                <button class="edit-btn" aria-label="Edit task">✎</button>
                <button class="delete-btn" aria-label="Delete task">&times;</button>
            `;

            // Event Listeners for dynamic elements
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleComplete(task.id));

            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                editingTaskId = task.id;
                taskInput.value = task.text;
                priorityInput.value = task.priority;
                dateInput.value = task.dueDate;
                submitBtn.textContent = 'Update Task';
                taskInput.focus();
            });

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskList.appendChild(li);
        });

        updateCount();
    }

    function toggleComplete(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveAndRender();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        if (id === editingTaskId) {
            editingTaskId = null;
            submitBtn.textContent = 'Add Task';
            taskForm.reset();
        }
        saveAndRender();
    }

    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(task => !task.completed);
        saveAndRender();
    });

    function updateCount() {
        const count = tasks.filter(t => !t.completed).length;
        pendingCount.textContent = `${count} task${count !== 1 ? 's' : ''} pending`;
    }

    function saveAndRender() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }

    function getPriorityColor(priority) {
        switch(priority) {
            case 'high': return 'var(--priority-high)';
            case 'medium': return 'var(--priority-medium)';
            case 'low': return 'var(--priority-low)';
            default: return '#ccc';
        }
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Popup Logic
    popupClose.addEventListener('click', () => {
        popup.classList.remove('show');
    });

    // Reminder Logic
    function checkReminders() {
        const now = new Date().getTime();
        let tasksUpdated = false;

        tasks.forEach(task => {
            if (task.completed || task.notified) return;

            const dueTime = new Date(task.dueDate).getTime();
            if (isNaN(dueTime)) return;

            const timeDiff = dueTime - now;

            // Notify if due or within the last 30 minutes (to catch missed tasks)
            if (timeDiff <= 0 && timeDiff > -1800000) {
                console.log(`Triggering notification for: ${task.text}`);

                // Play notification sound
                const audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/0/05/Beep-09.ogg');
                audio.play().catch(e => console.log('Audio play failed:', e));

                // Show custom popup
                popupTitle.textContent = 'Task Due!';
                popupMessage.textContent = `It's time to complete: ${task.text}`;
                popup.classList.add('show');

                if ("Notification" in window && Notification.permission === "granted") {
                    const notification = new Notification(`Task Due: ${task.text}`, {
                        body: `It's time to complete this task!`,
                        icon: '/favicon.ico' // Optional icon path
                    });

                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                    };
                }
                
                task.notified = true;
                tasksUpdated = true;
            }
        });

        if (tasksUpdated) {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    }

    // Initial Load
    renderTasks();
    // Check for reminders every second for precise timing
    setInterval(checkReminders, 1000);
});