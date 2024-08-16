document.getElementById('register-form').addEventListener('submit', registerUser);
document.getElementById('login-form').addEventListener('submit', loginUser);
document.getElementById('logout-button').addEventListener('click', logoutUser);
document.getElementById('task-form').addEventListener('submit', addTask);

const API_URL = 'http://localhost:5000';

const errorModal = document.getElementById('error-modal');
const modalMessage = document.getElementById('modal-message');
const closeModalButton = document.getElementById('close-modal');

const editTaskModal = document.getElementById('edit-task-modal');
const editTaskInput = document.getElementById('edit-task-input');
const saveTaskButton = document.getElementById('save-task-button');
const closeEditModalButton = document.getElementById('close-edit-modal');

let currentEditTaskId = null;  


function showErrorModal(message) {
    modalMessage.textContent = message;
    errorModal.style.display = 'block';
}


closeModalButton.addEventListener('click', () => {
    errorModal.style.display = 'none';
});

closeEditModalButton.addEventListener('click', () => {
    editTaskModal.style.display = 'none';
});


window.addEventListener('click', (event) => {
    if (event.target == errorModal) {
        errorModal.style.display = 'none';
    }
    if (event.target == editTaskModal) {
        editTaskModal.style.display = 'none';
    }
});


function showEditTaskModal(taskId, taskText) {
    currentEditTaskId = taskId;
    editTaskInput.value = taskText;
    editTaskModal.style.display = 'block';
}


saveTaskButton.addEventListener('click', async () => {
    const newTaskText = editTaskInput.value.trim();

    if (newTaskText === "") {
        showErrorModal("Task cannot be empty.");
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/tasks/${currentEditTaskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({ text: newTaskText }),
        });

        const data = await response.json();

        if (!response.ok) {
            showErrorModal('Failed to edit task');
            return;
        }

        loadTasks();
        editTaskModal.style.display = 'none';  
    } catch (err) {
        console.error('Error during task edit:', err);
        showErrorModal('Error editing task');
    }
});

async function registerUser(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            showTodoList();
        } else {
            showErrorModal('Registration failed');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        showErrorModal('Registration error');
    }
}

async function loginUser(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            showTodoList();
        } else {
            showErrorModal('Login failed');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showErrorModal('Login error');
    }
}

function showTodoList() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('todo-container').style.display = 'block';
    loadTasks();
}

function logoutUser() {
    localStorage.removeItem('token');
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('todo-container').style.display = 'none';
}

async function fetchTasks() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tasks`, {
        headers: { 'x-auth-token': token },
    });
    const tasks = await response.json();
    return tasks;
}

async function addTask(e) {
    e.preventDefault();
    const taskInput = document.getElementById('task-input').value;
    const token = localStorage.getItem('token');

    if (taskInput === '') return;

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({ text: taskInput }),
        });

        const data = await response.json();

        if (!response.ok) {
            showErrorModal('Failed to add task');
            return;
        }

        loadTasks();
    } catch (err) {
        console.error('Error during task addition:', err);
        showErrorModal('Error adding task');
    }
}

async function loadTasks() {
    const token = localStorage.getItem('token');
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { 'x-auth-token': token },
        });
        const tasks = await response.json();

        if (!response.ok) {
            showErrorModal('Failed to load tasks');
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.text;
            li.dataset.id = task._id;

            const editBtn = document.createElement('button');
            editBtn.classList.add('edit');
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => showEditTaskModal(task._id, task.text));  

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteTask(task._id));

            li.appendChild(editBtn);
            li.appendChild(deleteBtn);

            taskList.appendChild(li);
        });
    } catch (err) {
        console.error('Error during task loading:', err);
        showErrorModal('Error loading tasks');
    }
}

async function deleteTask(id) {
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token },
        });
        loadTasks();
    } catch (err) {
        console.error('Error during task deletion:', err);
        showErrorModal('Error deleting task');
    }
}

function init() {
    const token = localStorage.getItem('token');
    if (token) {
        showTodoList();
    }
}

init();
