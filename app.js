
const STORAGE_KEY = '2512';

let opportunities = [];
let currentFilter = 'all';
let nextId = 1;

// DOM references
const availableList = document.getElementById('available-list');
const savedList = document.getElementById('saved-list');
const availableCount = document.getElementById('available-count');
const savedCount = document.getElementById('saved-count');
const addBtn = document.getElementById('add-btn');
const input = document.getElementById('opportunity-input');
const errorMessage = document.getElementById('error-message');
const filterBtns = document.querySelectorAll('.filter-btn');

/* Event delegation explanation:
   Attaching ONE listener to each grid container instead of individual
   button listeners prevents memory leaks when cards are added/removed.
   Memory scales O(1) instead of O(n). The delegated listener remains
   stable even when the DOM is re-rendered or filtered. */

// Event delegation on available list
availableList.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const card = button.closest('[data-card-id]');
    if (!card) return;

    const cardId = parseInt(card.dataset.cardId);
    const action = button.dataset.action;

    if (action === 'save') {
        moveCard(cardId, 'saved');
    } else if (action === 'remove') {
        removeCard(cardId);
    }
});

// Event delegation on saved list
savedList.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const card = button.closest('[data-card-id]');
    if (!card) return;

    const cardId = parseInt(card.dataset.cardId);
    const action = button.dataset.action;

    if (action === 'save') {
        moveCard(cardId, 'available');
    } else if (action === 'remove') {
        removeCard(cardId);
    }
});

// Add opportunity
addBtn.addEventListener('click', addOpportunity);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addOpportunity();
});

// Filter buttons
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        filterBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        currentFilter = btn.dataset.filter;
        applyFilter();
    });
});

function addOpportunity() {
    const title = input.value.trim();

    // Validation: reject empty or whitespace-only
    if (!title) {
        errorMessage.textContent = 'Please enter a valid opportunity title.';
        input.focus();
        return;
    }

    errorMessage.textContent = '';

    const newOpportunity = {
        id: nextId++,
        title: title,
        category: 'internship', // Default category
        status: 'available'
    };

    opportunities.push(newOpportunity);
    input.value = '';
    saveToLocalStorage();
    render();
}

function moveCard(id, newStatus) {
    const opp = opportunities.find(o => o.id === id);
    if (opp) {
        opp.status = newStatus;
        saveToLocalStorage();
        render();
    }
}

function removeCard(id) {
    opportunities = opportunities.filter(o => o.id !== id);
    saveToLocalStorage();
    render();
}

function applyFilter() {
    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => {
        const category = card.dataset.category;
        if (currentFilter === 'all' || category === currentFilter) {
            card.removeAttribute('data-hidden');
        } else {
            card.setAttribute('data-hidden', 'true');
        }
    });
}

function render() {
    const available = opportunities.filter(o => o.status === 'available');
    const saved = opportunities.filter(o => o.status === 'saved');

    // Update counts
    availableCount.textContent = available.length;
    savedCount.textContent = saved.length;

    // Render available
    availableList.innerHTML = available.map(opp => `
        <article class="card" data-card-id="${opp.id}" data-category="${opp.category}">
            <h3>${escapeHtml(opp.title)}</h3>
            <span class="card-category">${opp.category}</span>
            <div class="card-actions">
                <button data-action="save" class="save-btn">Save</button>
                <button data-action="remove" class="remove-btn">Remove</button>
            </div>
        </article>
    `).join('');

    // Render saved
    savedList.innerHTML = saved.map(opp => `
        <article class="card" data-card-id="${opp.id}" data-category="${opp.category}">
            <h3>${escapeHtml(opp.title)}</h3>
            <span class="card-category">${opp.category}</span>
            <div class="card-actions">
                <button data-action="save" class="save-btn">Move to Available</button>
                <button data-action="remove" class="remove-btn">Remove</button>
            </div>
        </article>
    `).join('');

    applyFilter();
}

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opportunities));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        opportunities = JSON.parse(saved);
        // Find highest ID to continue sequence
        nextId = opportunities.length > 0 
            ? Math.max(...opportunities.map(o => o.id)) + 1 
            : 1;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
loadFromLocalStorage();
render();
