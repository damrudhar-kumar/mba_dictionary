// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categoryBtns = document.querySelectorAll('.category-btn');
const dictionaryResults = document.getElementById('dictionary-results');
const bookmarksContainer = document.getElementById('bookmarks-container');
const clearBookmarksBtn = document.getElementById('clear-bookmarks');
const resultCount = document.getElementById('result-count');
const termModal = document.getElementById('term-modal');
const closeModal = document.querySelector('.close-modal');
const modalTerm = document.getElementById('modal-term');
const modalDefinition = document.getElementById('modal-definition');
const modalExample = document.getElementById('modal-example');
const modalCategory = document.getElementById('modal-category');
const bookmarkBtn = document.getElementById('bookmark-btn');
const userNotes = document.getElementById('user-notes');
const saveNotesBtn = document.getElementById('save-notes');
const todTerm = document.getElementById('tod-title');
const todDefinition = document.getElementById('tod-definition');
const todCategory = document.getElementById('tod-category');

// App State
let termsData = [];
let filteredTerms = [];
let currentCategory = 'all';
let searchQuery = '';
let bookmarkedTerms = JSON.parse(localStorage.getItem('bookmarkedTerms')) || [];
let termNotes = JSON.parse(localStorage.getItem('termNotes')) || {};

// Initialize the app
async function init() {
    try {
        // Load the terms data
        const response = await fetch('data.json');
        termsData = await response.json();
        
        // Set up event listeners
        setupEventListeners();
        
        // Display initial data
        filterTerms();
        displayTermOfTheDay();
        displayBookmarks();
    } catch (error) {
        console.error('Error loading the dictionary:', error);
        dictionaryResults.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load the dictionary. Please try again later.</p>
            </div>
        `;
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        filterTerms();
    });
    
    searchBtn.addEventListener('click', () => {
        searchQuery = searchInput.value.toLowerCase();
        filterTerms();
    });
    
    // Category filtering
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            filterTerms();
        });
    });
    
    // Modal interactions
    closeModal.addEventListener('click', () => {
        termModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === termModal) {
            termModal.style.display = 'none';
        }
    });
    
    // Bookmarking
    bookmarkBtn.addEventListener('click', toggleBookmark);
    
    // Notes
    saveNotesBtn.addEventListener('click', saveNotes);
    
    // Clear bookmarks
    clearBookmarksBtn.addEventListener('click', clearAllBookmarks);
}

// Filter terms based on search query and category
function filterTerms() {
    filteredTerms = termsData.filter(term => {
        const matchesSearch = term.term.toLowerCase().includes(searchQuery) || 
                             term.definition.toLowerCase().includes(searchQuery);
        const matchesCategory = currentCategory === 'all' || term.category === currentCategory;
        return matchesSearch && matchesCategory;
    });
    
    displayTerms();
}

// Display filtered terms
function displayTerms() {
    if (filteredTerms.length === 0) {
        dictionaryResults.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No terms found matching your search.</p>
            </div>
        `;
        resultCount.textContent = '0';
        return;
    }
    
    dictionaryResults.innerHTML = '';
    resultCount.textContent = filteredTerms.length;
    
    filteredTerms.forEach(term => {
        const termCard = document.createElement('div');
        termCard.className = 'term-card';
        termCard.innerHTML = `
            <h3>${term.term}</h3>
            <p>${term.definition.substring(0, 150)}${term.definition.length > 150 ? '...' : ''}</p>
            <div class="term-meta">
                <span class="category-tag">${term.category}</span>
                <i class="fas fa-bookmark bookmark-icon ${bookmarkedTerms.includes(term.term) ? 'bookmarked' : ''}" 
                   data-term="${term.term}"></i>
            </div>
        `;
        
        // Add click event to open modal with term details
        termCard.addEventListener('click', () => {
            openTermModal(term);
        });
        
        // Add click event for bookmark icon
        const bookmarkIcon = termCard.querySelector('.bookmark-icon');
        bookmarkIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBookmarkForTerm(term.term);
            bookmarkIcon.classList.toggle('bookmarked');
        });
        
        dictionaryResults.appendChild(termCard);
    });
}

// Open modal with term details
function openTermModal(term) {
    modalTerm.textContent = term.term;
    modalDefinition.textContent = term.definition;
    modalExample.textContent = term.example || 'No example provided.';
    modalCategory.textContent = term.category;
    
    // Set up bookmark button
    const isBookmarked = bookmarkedTerms.includes(term.term);
    bookmarkBtn.innerHTML = `<i class="far ${isBookmarked ? 'fa-bookmark' : 'fa-bookmark'}"></i> ${isBookmarked ? 'Bookmarked' : 'Bookmark'}`;
    bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
    bookmarkBtn.dataset.term = term.term;
    
    // Load user notes
    userNotes.value = termNotes[term.term] || '';
    
    // Show modal
    termModal.style.display = 'block';
}

// Toggle bookmark in modal
function toggleBookmark() {
    const term = this.dataset.term;
    toggleBookmarkForTerm(term);
    
    // Update button appearance
    const isBookmarked = bookmarkedTerms.includes(term);
    this.innerHTML = `<i class="far ${isBookmarked ? 'fa-bookmark' : 'fa-bookmark'}"></i> ${isBookmarked ? 'Bookmarked' : 'Bookmark'}`;
    this.classList.toggle('bookmarked', isBookmarked);
    
    // Update bookmark icon in the results
    const bookmarkIcons = document.querySelectorAll(`.bookmark-icon[data-term="${term}"]`);
    bookmarkIcons.forEach(icon => {
        icon.classList.toggle('bookmarked', isBookmarked);
    });
    
    // Update bookmarks display
    displayBookmarks();
}

// Toggle bookmark for a specific term
function toggleBookmarkForTerm(term) {
    const index = bookmarkedTerms.indexOf(term);
    if (index === -1) {
        bookmarkedTerms.push(term);
    } else {
        bookmarkedTerms.splice(index, 1);
    }
    
    // Save to localStorage
    localStorage.setItem('bookmarkedTerms', JSON.stringify(bookmarkedTerms));
}

// Save user notes for a term
function saveNotes() {
    const term = bookmarkBtn.dataset.term;
    termNotes[term] = userNotes.value;
    localStorage.setItem('termNotes', JSON.stringify(termNotes));
    
    // Show confirmation
    const originalText = saveNotesBtn.textContent;
    saveNotesBtn.textContent = 'Saved!';
    saveNotesBtn.style.backgroundColor = '#27ae60';
    
    setTimeout(() => {
        saveNotesBtn.textContent = originalText;
        saveNotesBtn.style.backgroundColor = '';
    }, 2000);
}

// Display bookmarked terms
function displayBookmarks() {
    if (bookmarkedTerms.length === 0) {
        bookmarksContainer.innerHTML = `
            <div class="empty-state">
                <i class="far fa-bookmark"></i>
                <p>You haven't bookmarked any terms yet.</p>
            </div>
        `;
        return;
    }
    
    bookmarksContainer.innerHTML = '';
    
    bookmarkedTerms.forEach(termName => {
        const term = termsData.find(t => t.term === termName);
        if (term) {
            const termCard = document.createElement('div');
            termCard.className = 'term-card';
            termCard.innerHTML = `
                <h3>${term.term}</h3>
                <p>${term.definition.substring(0, 150)}${term.definition.length > 150 ? '...' : ''}</p>
                <div class="term-meta">
                    <span class="category-tag">${term.category}</span>
                    <i class="fas fa-bookmark bookmark-icon bookmarked" data-term="${term.term}"></i>
                </div>
            `;
            
            termCard.addEventListener('click', () => {
                openTermModal(term);
            });
            
            // Add click event for bookmark icon
            const bookmarkIcon = termCard.querySelector('.bookmark-icon');
            bookmarkIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleBookmarkForTerm(term.term);
                displayBookmarks();
                displayTerms(); // Update the main view as well
            });
            
            bookmarksContainer.appendChild(termCard);
        }
    });
}

// Clear all bookmarks
function clearAllBookmarks() {
    if (confirm('Are you sure you want to clear all your bookmarks?')) {
        bookmarkedTerms = [];
        localStorage.setItem('bookmarkedTerms', JSON.stringify(bookmarkedTerms));
        displayBookmarks();
        displayTerms(); // Update the main view to remove bookmark icons
    }
}

// Display term of the day
function displayTermOfTheDay() {
    // Get a random term
    const randomIndex = Math.floor(Math.random() * termsData.length);
    const todTermData = termsData[randomIndex];
    
    todTerm.textContent = todTermData.term;
    todDefinition.textContent = todTermData.definition.substring(0, 200) + 
                              (todTermData.definition.length > 200 ? '...' : '');
    todCategory.textContent = todTermData.category;
    
    // Make the card clickable to open the full term
    const todCard = document.querySelector('.tod-card');
    todCard.addEventListener('click', () => {
        openTermModal(todTermData);
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);