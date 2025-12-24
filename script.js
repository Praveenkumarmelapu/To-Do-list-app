// Support for theme toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.onclick = function() {
    document.body.classList.toggle('light');
};
// Voice add support
const voiceBtn = document.getElementById('voiceBtn');
voiceBtn.onclick = function() {
    if ('webkitSpeechRecognition' in window) {
        const rec = new webkitSpeechRecognition();
        rec.lang = 'en-US';
        rec.onresult = function(e) {
            document.getElementById('todoInput').value = e.results.transcript;
        };
        rec.start();
    } else {
        alert("Voice recognition not supported.");
    }
};

const todoInput = document.getElementById('todoInput');
const reminderInput = document.getElementById('reminderInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const categoryInput = document.getElementById('categoryInput');
const priorityInput = document.getElementById('priorityInput');
const repeatInput = document.getElementById('repeatInput');
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const filterPriority = document.getElementById('filterPriority');
const statsDiv = document.getElementById('stats');

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', function(event){
    if(event.key==='Enter'){ addTodo();}
});
searchInput.addEventListener('input', renderTodos);
filterCategory.addEventListener('change', renderTodos);
filterPriority.addEventListener('change', renderTodos);

function loadTodos() {
    return JSON.parse(localStorage.getItem('todos')||'[]');
}
function saveTodos(todos) {
    localStorage.setItem('todos', JSON.stringify(todos));
}
function addTodo() {
    let text = todoInput.value.trim();
    let reminder = reminderInput.value;
    let cat = categoryInput.value;
    let prio = priorityInput.value;
    let repeat = repeatInput.checked;
    if(!text) return;
    let todos = loadTodos();
    todos.push({
        text, reminder, category:cat, priority:prio, repeat, completed:false, created:Date.now(),
        notes: prompt('Enter details or notes (optional):',''),
        subtasks: [], // extend for subtasks with more UI
        timeSpent: 0  // for tracking
    });
    saveTodos(todos);
    todoInput.value = '';
    reminderInput.value = '';
    repeatInput.checked = false;
    renderTodos();
}
function renderTodos() {
    let todos = loadTodos();
    // Filtering
    if(searchInput.value) {
        todos = todos.filter(t=>t.text.toLowerCase().includes(searchInput.value.toLowerCase()));
    }
    if(filterCategory.value) {
        todos = todos.filter(t=>t.category === filterCategory.value);
    }
    if(filterPriority.value) {
        todos = todos.filter(t=>t.priority === filterPriority.value);
    }
    todoList.innerHTML = '';
    todos.forEach((t,i)=>{
        let li = document.createElement('li');
        if(t.completed) li.classList.add('completed');
        li.classList.add(t.priority==='High'?'prioHigh':t.priority==='Medium'?'prioMed':'prioLow');
        li.innerHTML = `
        <input type="checkbox" ${t.completed?'checked':''} class="checkBox">
        <span class="taskText">${t.text}</span>
        <span class="category" style="margin-left:5px;color:#92bad3;">${t.category}</span>
        <span class="reminderTime">${t.reminder||''}</span>
        ${t.repeat?'<span style="color:#f39c12;">⟳</span>':''}
        <button class="statsBtn">⏱️</button>
        <button class="deleteBtn" style="margin-left:5px">Delete</button>
        <button class="noteBtn" style="margin-left:5px">📝</button>
        `;
        // Subtasks + notes
        if(t.notes) {
            let note = document.createElement('div');
            note.className = 'note';
            note.innerText = t.notes;
            li.append(note);
        }
        // Checkbox logic
        li.querySelector('.checkBox').onchange = function() {
            t.completed = !t.completed;
            saveTodos(todos); renderTodos();
        };
        // Delete logic
        li.querySelector('.deleteBtn').onclick = function() {
            todos.splice(i,1); saveTodos(todos); renderTodos();
        };
        // Notes edit logic
        li.querySelector('.noteBtn').onclick = function() {
            t.notes = prompt('Edit Notes:',t.notes||'')||'';
            saveTodos(todos); renderTodos();
        };
        // Stats (dummy time tracking)
        li.querySelector('.statsBtn').onclick = function() {
            alert(`Time Spent: ${Math.floor((Date.now()-t.created)/60000)} minutes`);
        };
        todoList.append(li);
    });
    // Productivity stats
    let total = todos.length, done = todos.filter(t=>t.completed).length;
    statsDiv.innerHTML = `<b class="stats">Tasks: ${done}/${total} completed | ${total-done} pending </b>`;
    checkReminders(todos);
}
function checkReminders(todos) {
    let now = new Date();
    let currentTime = now.toTimeString().slice(0,5);
    todos.forEach(t=>{
        // Repeat daily logic
        if(t.reminder && !t.completed && t.reminder===currentTime) {
            let msg = `Reminder: ${t.text} (${t.category}, ${t.priority})`;
            alert(msg);
            if("Notification" in window && Notification.permission==="granted"){ new Notification(msg); }
        }
    });
}
window.onload = function() {
    if("Notification" in window && Notification.permission!=="granted") {
        Notification.requestPermission();
    }
    renderTodos();
};
setInterval(()=>renderTodos(),60000); // update reminders
