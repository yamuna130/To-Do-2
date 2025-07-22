/**
 * Modern Todo Application
 * Built with vanilla JavaScript, HTML5, and CSS3
 */

class TaskManager {
    constructor() {
        // DOM elements
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        this.taskCount = document.getElementById('taskCount');
        this.toastContainer = document.getElementById('toastContainer');

        // Application state
        this.tasks = [];
        this.taskIdCounter = 0;

        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.loadTasksFromStorage();
        this.bindEventListeners();
        this.render();
        this.focusInput();
    }

    /**
     * Bind event listeners to DOM elements
     */
    bindEventListeners() {
        // Add task button click
        this.addTaskBtn.addEventListener('click', () => this.handleAddTask());

        // Enter key press in input field
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddTask();
            }
        });

        // Input field changes (remove error state)
        this.taskInput.addEventListener('input', () => {
            this.taskInput.classList.remove('error');
        });

        // Handle keyboard navigation
        this.taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.taskInput.blur();
            }
        });
    }

    /**
     * Handle adding a new task
     */
    handleAddTask() {
        const taskText = this.taskInput.value.trim();

        // Validate input
        if (!taskText) {
            this.showError('Please enter a task!');
            return;
        }

        if (taskText.length > 100) {
            this.showError('Task is too long! Maximum 100 characters.');
            return;
        }

        // Check for duplicates (case-insensitive)
        if (this.isDuplicateTask(taskText)) {
            this.showError('This item is already in the list!');
            return;
        }

        // Create and add the task
        const newTask = this.createTask(taskText);
        this.addTask(newTask);

        // Clear input and show success
        this.taskInput.value = '';
        this.showSuccess('Task added successfully!');
        this.focusInput();
    }

    /**
     * Create a new task object
     * @param {string} text - The task text
     * @returns {Object} Task object
     */
    createTask(text) {
        return {
            id: ++this.taskIdCounter,
            text: this.sanitizeText(text),
            createdAt: new Date(),
            timestamp: Date.now()
        };
    }

    /**
     * Add a task to the list
     * @param {Object} task - Task object to add
     */
    addTask(task) {
        this.tasks.unshift(task); // Add to beginning for newest first
        this.saveTasksToStorage();
        this.render();
    }

    /**
     * Delete a task by ID
     * @param {number} taskId - ID of task to delete
     */
    deleteTask(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        
        if (taskElement) {
            // Add removing animation
            taskElement.classList.add('removing');
            
            // Remove from array after animation
            setTimeout(() => {
                this.tasks = this.tasks.filter(task => task.id !== taskId);
                this.saveTasksToStorage();
                this.render();
                this.showSuccess('Task deleted!');
            }, 400);
        }
    }

    /**
     * Check if task already exists (case-insensitive)
     * @param {string} text - Task text to check
     * @returns {boolean} True if duplicate exists
     */
    isDuplicateTask(text) {
        return this.tasks.some(task => 
            task.text.toLowerCase() === text.toLowerCase()
        );
    }

    /**
     * Sanitize text input to prevent XSS
     * @param {string} text - Text to sanitize
     * @returns {string} Sanitized text
     */
    sanitizeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format date for display
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const now = new Date();
        const taskDate = new Date(date);
        const diffInHours = (now - taskDate) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - taskDate) / (1000 * 60));
            return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return taskDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: taskDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    /**
     * Render the tasks list and update UI
     */
    render() {
        // Update task counter
        this.updateTaskCounter();

        // Show/hide empty state
        if (this.tasks.length === 0) {
            this.tasksList.innerHTML = '';
            this.emptyState.classList.add('show');
            return;
        }

        this.emptyState.classList.remove('show');

        // Render tasks
        const tasksHTML = this.tasks.map((task, index) => 
            this.createTaskHTML(task, index)
        ).join('');

        this.tasksList.innerHTML = tasksHTML;

        // Bind delete buttons
        this.bindDeleteButtons();
    }

    /**
     * Create HTML for a single task
     * @param {Object} task - Task object
     * @param {number} index - Task index for animation delay
     * @returns {string} HTML string
     */
    createTaskHTML(task, index) {
        return `
            <div class="task-item" data-task-id="${task.id}" style="animation-delay: ${index * 50}ms">
                <div class="task-content">
                    <div class="task-text">${task.text}</div>
                    <div class="task-meta">
                        <div class="task-date">
                            📅 ${this.formatDate(task.createdAt)}
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="delete-btn" data-delete-id="${task.id}" title="Delete task">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners to delete buttons
     */
    bindDeleteButtons() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(button.dataset.deleteId);
                this.deleteTask(taskId);
            });
        });
    }

    /**
     * Update the task counter display
     */
    updateTaskCounter() {
        const count = this.tasks.length;
        this.taskCount.textContent = `${count} ${count === 1 ? 'task' : 'tasks'}`;
    }

    /**
     * Focus the input field
     */
    focusInput() {
        setTimeout(() => {
            this.taskInput.focus();
        }, 100);
    }

    /**
     * Show error message and apply error styling
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.taskInput.classList.add('error');
        this.showToast(message, 'error');
        
        // Remove error class after animation
        setTimeout(() => {
            this.taskInput.classList.remove('error');
        }, 400);
    }

    /**
     * Show success message
     * @param {string} message - Success message to display
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success, error)
     */
    showToast(message, type) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✅' : '❌';
        const title = type === 'success' ? 'Success' : 'Error';
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        // Add to container and show
        this.toastContainer.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Save tasks to localStorage
     */
    saveTasksToStorage() {
        try {
            const dataToSave = {
                tasks: this.tasks,
                taskIdCounter: this.taskIdCounter
            };
            localStorage.setItem('modernTodoTasks', JSON.stringify(dataToSave));
        } catch (error) {
            console.warn('Failed to save tasks to localStorage:', error);
        }
    }

    /**
     * Load tasks from localStorage
     */
    loadTasksFromStorage() {
        try {
            const savedData = localStorage.getItem('modernTodoTasks');
            if (savedData) {
                const { tasks, taskIdCounter } = JSON.parse(savedData);
                this.tasks = tasks || [];
                this.taskIdCounter = taskIdCounter || 0;
                
                // Convert date strings back to Date objects
                this.tasks.forEach(task => {
                    if (typeof task.createdAt === 'string') {
                        task.createdAt = new Date(task.createdAt);
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to load tasks from localStorage:', error);
            this.tasks = [];
            this.taskIdCounter = 0;
        }
    }

    /**
     * Clear all tasks (for debugging/testing)
     */
    clearAllTasks() {
        this.tasks = [];
        this.taskIdCounter = 0;
        this.saveTasksToStorage();
        this.render();
        this.showSuccess('All tasks cleared!');
    }

    /**
     * Get application statistics
     * @returns {Object} Application statistics
     */
    getStats() {
        return {
            totalTasks: this.tasks.length,
            oldestTask: this.tasks.length > 0 ? 
                Math.min(...this.tasks.map(t => t.timestamp)) : null,
            newestTask: this.tasks.length > 0 ? 
                Math.max(...this.tasks.map(t => t.timestamp)) : null
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance for easy debugging
    window.taskManager = new TaskManager();
    
    // Optional: Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            window.taskManager.focusInput();
        }
        
        // Ctrl/Cmd + Shift + C to clear all tasks (for debugging)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            if (confirm('Are you sure you want to clear all tasks?')) {
                window.taskManager.clearAllTasks();
            }
        }
    });
    
    console.log('🚀 TaskFlow initialized successfully!');
    console.log('💡 Keyboard shortcuts:');
    console.log('   • Ctrl/Cmd + K: Focus input');
    console.log('   • Ctrl/Cmd + Shift + C: Clear all tasks');
    console.log('   • Use window.taskManager to access the app instance');
    });