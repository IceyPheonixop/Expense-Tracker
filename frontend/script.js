// --- Global State ---
let allExpenses = []; // To store all expenses from the server
let currentCategoryFilter = 'all'; // To store the current filter state
const API_URL = '/api/expenses'; // The backend API endpoint

// --- UI Elements ---
const expenseListEl = document.getElementById('expense-list');
const addExpenseForm = document.getElementById('add-expense-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const totalExpensesEl = document.getElementById('total-expenses');
const loadingMessageEl = document.getElementById('loading-message');
const messageModal = document.getElementById('message-modal');
const messageText = document.getElementById('message-text');
const categoryFilterEl = document.getElementById('category-filter');

// --- Helper Functions ---

/**
 * Shows a custom message to the user (replaces alert).
 * @param {string} message - The message to display.
 * @param {boolean} [isError=false] - If true, styles as an error (red).
 */
function showMessage(message, isError = false) {
    messageText.textContent = message;
    messageModal.classList.remove('msg-success', 'msg-error', 'show');
    messageModal.classList.add(isError ? 'msg-error' : 'msg-success');
    
    setTimeout(() => {
        messageModal.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        messageModal.classList.remove('show');
    }, 3000);
}

/**
 * Formats a number as an INR currency string.
 * @param {number} amount - The number to format.
 * @returns {string} - Formatted currency string (e.g., ₹1,234.56).
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// --- App Logic & API Calls ---

/**
 * Fetches all expenses from the backend server.
 */
async function fetchExpenses() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const expenses = await response.json();
        
        allExpenses = expenses;
        let total = 0;
        let categories = new Set();
        
        allExpenses.forEach(expense => {
            total += expense.amount;
            categories.add(expense.category);
        });

        totalExpensesEl.textContent = formatCurrency(total);
        populateCategoryFilter(categories);
        filterAndRenderExpenses();

        if (loadingMessageEl) {
            loadingMessageEl.style.display = 'none';
        }

    } catch (error) {
        console.error("Error fetching expenses:", error);
        showMessage("Error fetching expenses. Please refresh.", true);
        if (loadingMessageEl) {
            loadingMessageEl.textContent = 'Could not load expenses.';
        }
    }
}

/**
 * Renders the list of expenses to the DOM.
 * @param {Array} expenses - An array of expense objects.
 */
function renderExpenseList(expenses) {
    expenseListEl.innerHTML = ''; // Clear current list
    if (expenses.length === 0) {
        if (currentCategoryFilter === 'all') {
            expenseListEl.innerHTML = '<p class="list-message">No expenses found. Add one above!</p>';
        } else {
            expenseListEl.innerHTML = `<p class="list-message">No expenses found for category "<strong>${currentCategoryFilter}</strong>".</p>`;
        }
        return;
    }

    expenses.forEach(expense => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        
        // Format date
        let dateString = '';
        if (expense.createdAt) {
            dateString = new Date(expense.createdAt).toLocaleDateString('en-IN');
        }

        item.innerHTML = `
            <div class="info">
                <span class="description">${expense.description}</span>
                <div class="category-date">
                    <span class="category">${expense.category}</span>
                    <span class="date">${dateString}</span>
                </div>
            </div>
            <div class="amount-actions">
                <span class="amount">-${formatCurrency(expense.amount)}</span>
                <button data-id="${expense._id}" class="delete-btn">
                    &times;
                </button>
            </div>
        `;
        expenseListEl.appendChild(item);
    });
}

/**
 * Populates the category filter dropdown with unique categories.
 * @param {Set<string>} categories - A set of unique category strings.
 */
function populateCategoryFilter(categories) {
    const selectedValue = categoryFilterEl.value;
    
    while (categoryFilterEl.options.length > 1) {
        categoryFilterEl.remove(1);
    }

    const sortedCategories = [...categories].sort();
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilterEl.appendChild(option);
    });

    if (Array.from(categoryFilterEl.options).some(opt => opt.value === selectedValue)) {
         categoryFilterEl.value = selectedValue;
    } else {
        categoryFilterEl.value = 'all';
        currentCategoryFilter = 'all'; 
    }
}

function filterAndRenderExpenses() {
    let filteredExpenses;

    if (currentCategoryFilter === 'all') {
        filteredExpenses = allExpenses;
    } else {
        filteredExpenses = allExpenses.filter(expense => expense.category === currentCategoryFilter);
    }
    
    const sortedFilteredExpenses = filteredExpenses.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    renderExpenseList(sortedFilteredExpenses);
}

async function handleAddExpense(e) {
    e.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value.trim();

    if (!description || !amount || !category) {
        showMessage("Please fill out all fields.", true);
        return;
    }
    if (amount <= 0) {
        showMessage("Amount must be greater than zero.", true);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description, amount, category }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add expense');
        }

        await fetchExpenses(); 
        
        showMessage("Expense added!", false);
        addExpenseForm.reset();
        descriptionInput.focus();

    } catch (error) {
        console.error("Error adding expense:", error);
        showMessage(`Error adding expense: ${error.message}`, true);
    }
}

async function handleDeleteExpense(e) {
    const deleteButton = e.target.closest('.delete-btn');
    
    if (!deleteButton) {
        return;
    }

    const docId = deleteButton.getAttribute('data-id');
    if (!docId) return;

    try {
        const response = await fetch(`${API_URL}/${docId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete expense');
        }

        await fetchExpenses(); 
        showMessage("Expense deleted.", false);

    } catch (error) {
        console.error("Error deleting expense:", error);
        showMessage(`Error deleting expense: ${error.message}`, true);
    }
}

document.addEventListener('DOMContentLoaded', fetchExpenses);

addExpenseForm.addEventListener('submit', handleAddExpense);
expenseListEl.addEventListener('click', handleDeleteExpense);

categoryFilterEl.addEventListener('change', (e) => {
    currentCategoryFilter = e.target.value;
    filterAndRenderExpenses();
});