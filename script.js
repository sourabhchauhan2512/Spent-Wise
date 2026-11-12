
const STORAGE_KEY = "spendwise_expenses";
const BUDGET_KEY = "spendwise_budget";

let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let budget = Number(localStorage.getItem(BUDGET_KEY)) || 5000;

const $ = (id) => document.getElementById(id);

// Get today's date in local timezone
function getToday() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Currency format
function money(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);
}

// Save data in browser
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    localStorage.setItem(BUDGET_KEY, budget);
}

// Show notification
function showMessage(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");

    setTimeout(() => {
        $("toast").classList.remove("show");
    }, 2000);
}

// Get current month's expenses
function getMonthlyExpenses() {
    const today = new Date();

    return expenses.filter(item => {
        const date = new Date(item.date + "T00:00:00");

        return date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    });
}

// Update dashboard and expense table
function render() {

    const monthlyExpenses = getMonthlyExpenses();

    const monthlyTotal = monthlyExpenses.reduce(
        (sum, item) => sum + item.amount, 0
    );

    const allTotal = expenses.reduce(
        (sum, item) => sum + item.amount, 0
    );

    const remaining = budget - monthlyTotal;

    const percentage = Math.round(
        (monthlyTotal / budget) * 100
    );

    // Dashboard
    $("monthTotal").textContent = money(monthlyTotal);
    $("allTotal").textContent = money(allTotal);
    $("transactionCount").textContent = expenses.length;
    $("budgetDisplay").textContent = money(budget);

    // Budget details
    $("budgetSpent").textContent = money(monthlyTotal);
    $("budgetRemaining").textContent = money(Math.max(0, remaining));
    $("budgetPercent").textContent = percentage + "%";

    $("budgetBar").style.width =
        Math.min(percentage, 100) + "%";

    $("budgetBar").style.background =
        percentage > 100 ? "#c34242" : "#249260";

    if (percentage > 100) {
        $("budgetMessage").textContent =
            "You have exceeded your monthly budget!";
    } else if (percentage >= 80) {
        $("budgetMessage").textContent =
            "Warning! Most of your budget has been used.";
    } else {
        $("budgetMessage").textContent =
            "You are managing your budget well. Keep it up!";
    }

    // Search and category filter
    const search = $("searchInput").value.toLowerCase().trim();
    const category = $("filterCategory").value;

    const filtered = expenses
        .filter(item =>
            category === "All" || item.category === category
        )
        .filter(item =>
            item.title.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search)
        )
        .sort((a, b) => b.date.localeCompare(a.date));

    $("visibleCount").textContent =
        `Showing ${filtered.length} of ${expenses.length} expenses`;

    const tbody = $("expenseRows");
    tbody.innerHTML = "";

    if (filtered.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 5;
        cell.textContent = expenses.length
            ? "No matching expenses found."
            : "No expenses added yet.";

        return;
    }

    filtered.forEach(item => {

        const row = tbody.insertRow();

        const nameCell = row.insertCell();
        nameCell.textContent = item.title;

        const categoryCell = row.insertCell();
        categoryCell.textContent = item.category;

        const dateCell = row.insertCell();
        dateCell.textContent = new Date(
            item.date + "T00:00:00"
        ).toLocaleDateString("en-IN");

        const amountCell = row.insertCell();
        amountCell.textContent = money(item.amount);

        const actionCell = row.insertCell();

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", () => {
            deleteExpense(item.id);
        });

        actionCell.appendChild(deleteButton);
    });
}

// Add new expense
$("expenseForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const title = $("title").value.trim();
    const amount = Number($("amount").value);
    const category = $("category").value;
    const date = $("date").value;

    if (!title || !Number.isFinite(amount) ||
        amount <= 0 || !date) {

        showMessage("Please enter valid details!");
        return;
    }

    const expense = {
        id: Date.now() + Math.random(),
        title: title,
        amount: amount,
        category: category,
        date: date
    };

    expenses.push(expense);

    saveData();
    render();

    this.reset();

    $("date").value = getToday();

    showMessage("Expense added successfully!");
});

// Delete individual expense
function deleteExpense(id) {

    expenses = expenses.filter(item => item.id !== id);

    saveData();
    render();

    showMessage("Expense deleted successfully!");
}

// Search expenses
$("searchInput").addEventListener("input", render);

// Filter by category
$("filterCategory").addEventListener("change", render);

// Edit monthly budget
$("editBudget").addEventListener("click", function() {

    $("budgetInput").value = budget;
    $("budgetDialog").showModal();

});

// Save updated budget
$("budgetForm").addEventListener("submit", function(event) {

    if (event.submitter.value === "cancel") {
        return;
    }

    const newBudget = Number($("budgetInput").value);

    if (!Number.isFinite(newBudget) || newBudget <= 0) {
        event.preventDefault();
        showMessage("Please enter a valid budget!");
        return;
    }

    budget = newBudget;

    saveData();
    render();

    showMessage("Budget updated successfully!");
});

// Clear all expenses
$("clearAll").addEventListener("click", function() {

    if (expenses.length === 0) {
        showMessage("No expenses to clear!");
        return;
    }

    const confirmDelete = confirm(
        "Are you sure you want to delete all expenses?"
    );

    if (confirmDelete) {

        expenses = [];

        saveData();
        render();

        showMessage("All expenses cleared!");
    }
});

// Set today's date
$("date").value = getToday();

// Initial dashboard loading
render();
