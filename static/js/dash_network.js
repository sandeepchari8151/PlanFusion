document.addEventListener("DOMContentLoaded", function () {
    // Common Variables
    const contactList = document.querySelector(".contact-list");
    const contactGrid = document.querySelector(".contact-grid");
    const goalGrid = document.querySelector(".goal-grid");
    const searchInput = document.getElementById("contactSearch");
    const addContactBtn = document.getElementById("addContactBtn");
    const addGoalBtn = document.getElementById("addGoalBtn");
    const addContactForm = document.getElementById("addContactForm");
    const addGoalForm = document.getElementById("addGoalForm");
    const contactForm = document.getElementById("contactForm");
    const goalForm = document.getElementById("goalForm");
    const viewToggle = document.getElementById("nviewToggle");
    const sortToggle = document.getElementById("nsortToggle");
    const currentDateDisplay = document.getElementById("ncurrentDate");

    let contacts = [];
    let goals = [];
    let currentView = 'grid'; // 'grid' or 'list'

    // Initialize date pickers
    flatpickr(".flatpickr-input", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
    });

    // Update current date
    function updateCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateDisplay.textContent = now.toLocaleDateString(undefined, options);
    }
    updateCurrentDate();

    // Fetch initial data
    async function fetchData() {
        try {
            const [contactsResponse, goalsResponse] = await Promise.all([
                fetch('/api/contacts'),
                fetch('/api/goals')
            ]);

            if (!contactsResponse.ok || !goalsResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            contacts = await contactsResponse.json();
            goals = await goalsResponse.json();

            renderContacts(contacts);
            renderGoals();
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load network data. Please try again.');
        }
    }

    // Function to hide all forms
    function hideAllForms() {
        document.getElementById('addContactForm').style.display = 'none';
        document.getElementById('addGoalForm').style.display = 'none';
    }

    // Handle add contact button click
    addContactBtn.addEventListener('click', function() {
        hideAllForms();
        document.getElementById('addContactForm').style.display = 'block';
    });

    // Handle add goal button click
    addGoalBtn.addEventListener('click', function() {
        hideAllForms();
        document.getElementById('addGoalForm').style.display = 'block';
    });

    // Handle cancel contact button
    document.getElementById('cancelContact').addEventListener('click', function() {
        hideAllForms();
    });

    // Handle cancel goal button
    document.getElementById('cancelGoal').addEventListener('click', function() {
        hideAllForms();
    });

    // Handle contact form submission
    document.getElementById('contactForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            phone: document.getElementById('contactPhone').value,
            category: document.getElementById('contactCategory').value,
            lastInteraction: document.getElementById('lastInteraction').value,
            notes: document.getElementById('interactionNotes').value
        };

        try {
            const response = await fetch('/api/contacts', {
                        method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

                    if (!response.ok) {
                throw new Error(`Failed to add contact: ${response.status}`);
            }

            const newContact = await response.json();
            contacts.push(newContact);
            renderContacts(contacts);
            
            // Reset form and hide modal
            document.getElementById('contactForm').reset();
            hideAllForms();
            
            // Show success message
            alert('Contact added successfully!');
            
        } catch (error) {
            console.error('Error adding contact:', error);
            alert('Failed to add contact. Please try again.');
        }
    });

    // Handle goal form submission
    document.getElementById('goalForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            description: document.getElementById('goalDescription').value,
            type: document.getElementById('goalType').value,
            target: parseInt(document.getElementById('goalTarget').value) || 0,
            deadline: document.getElementById('goalDeadline').value,
            completed: parseInt(document.getElementById('goalCompleted').value) || 0
        };

        // Validate required fields
        if (!formData.description || !formData.type) {
            alert('Please fill in all required fields');
            return;
        }

        // Format deadline if provided
        if (formData.deadline) {
            try {
                const date = new Date(formData.deadline);
                formData.deadline = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            } catch (error) {
                alert('Invalid date format. Please use YYYY-MM-DD');
                return;
            }
        }

        try {
            const response = await fetch('/api/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to add goal: ${response.status}`);
            }

            const newGoal = await response.json();
            goals.push(newGoal);
            renderGoals();
            
            // Reset form and hide modal
            document.getElementById('goalForm').reset();
            hideAllForms();
            
            // Show success message
            alert('Goal added successfully!');
            
        } catch (error) {
            console.error('Error adding goal:', error);
            alert(error.message || 'Failed to add goal. Please try again.');
        }
    });

    // Render contacts in the current view
    function renderContacts(contacts) {
        const contactGrid = document.querySelector('.contact-grid');
        const contactList = document.querySelector('.contact-list');
        
        // Clear existing content
        contactGrid.innerHTML = '';
        contactList.innerHTML = '';
        
        if (currentView === 'grid') {
            contactGrid.style.display = 'grid';
            contactList.style.display = 'none';
            renderContactGrid(contacts);
        } else {
            contactGrid.style.display = 'none';
            contactList.style.display = 'block';
            renderContactList(contacts);
        }
    }

    // Render contacts in grid view
    function renderContactGrid(contacts) {
        contactGrid.innerHTML = '';
        contacts.forEach(contact => {
            const contactCard = createContactCard(contact);
            contactGrid.appendChild(contactCard);
        });
    }

    // Render contacts in list view
    function renderContactList(contacts) {
        contactList.innerHTML = '';
        contacts.forEach(contact => {
            const contactItem = createContactListItem(contact);
            contactList.appendChild(contactItem);
        });
    }

    // Create contact card for grid view
    function createContactCard(contact) {
        const card = document.createElement('div');
        card.className = 'contact-card';
        card.dataset.contactId = contact._id;

        const lastInteraction = new Date(contact.lastInteraction);
        const daysSinceInteraction = Math.floor((new Date() - lastInteraction) / (1000 * 60 * 60 * 24));
        const interactionStatus = daysSinceInteraction > 30 ? 'overdue' : daysSinceInteraction > 14 ? 'warning' : 'good';

        card.innerHTML = `
            <div class="contact-header">
                <div class="contact-avatar">
                    <i class="ri-user-fill"></i>
                </div>
                <div class="contact-info">
                    <h3>${contact.name}</h3>
                    <span class="contact-category ${contact.category}">${contact.category}</span>
                </div>
            </div>
            <div class="contact-details">
                <p><i class="ri-mail-line"></i> ${contact.email || 'No email'}</p>
                <p><i class="ri-phone-line"></i> ${contact.phone || 'No phone'}</p>
                <p class="interaction-status ${interactionStatus}">
                    <i class="ri-time-line"></i> Last interaction: ${formatDate(contact.lastInteraction)}
                </p>
            </div>
            <div class="contact-actions">
                <button class="action-btn followup-btn" title="Schedule Follow-up">
                    <i class="ri-calendar-event-line"></i>
                </button>
                <button class="action-btn notes-btn" title="View Notes">
                    <i class="ri-sticky-note-line"></i>
                </button>
                <button class="action-btn edit-btn" title="Edit Contact">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete Contact">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;

        return card;
    }

    // Create contact item for list view
    function createContactListItem(contact) {
        const div = document.createElement('div');
        div.className = 'contact-item';
        
        const lastInteraction = contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleDateString() : 'Never';
        
        div.innerHTML = `
            <div class="contact-main">
                <div class="contact-info">
                    <h4>${contact.name}</h4>
                    <div class="contact-details">
                        <p><i class="fas fa-envelope"></i>${contact.email || 'No email'}</p>
                        <p><i class="fas fa-phone"></i>${contact.phone || 'No phone'}</p>
                        <p><i class="fas fa-clock"></i>Last interaction: ${lastInteraction}</p>
                    </div>
                </div>
            </div>
            <div class="contact-actions">
                <button class="edit-contact" data-id="${contact._id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-contact" data-id="${contact._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return div;
    }

    // Render goals
    function renderGoals() {
        goalGrid.innerHTML = '';
        goals.forEach(goal => {
            const goalCard = createGoalCard(goal);
            goalGrid.appendChild(goalCard);
        });
    }

    // Create goal card
    function createGoalCard(goal) {
        const card = document.createElement('div');
        card.className = 'goal-card';
        card.dataset.goalId = goal._id;

        const progress = (goal.completed / goal.target) * 100;
        const deadline = new Date(goal.deadline);
        const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
        const deadlineStatus = daysLeft < 0 ? 'overdue' : daysLeft < 7 ? 'warning' : 'good';

        card.innerHTML = `
            <div class="goal-header">
                <h3>${goal.description}</h3>
                <span class="goal-type ${goal.type}">${goal.type}</span>
            </div>
            <div class="goal-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">${goal.completed}/${goal.target}</span>
            </div>
            <div class="goal-details">
                <p class="deadline ${deadlineStatus}">
                    <i class="ri-timer-line"></i> Deadline: ${formatDate(goal.deadline)}
                </p>
                <p class="days-left">${daysLeft} days remaining</p>
            </div>
            <div class="goal-actions">
                <button class="action-btn update-btn" title="Update Progress">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete Goal">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;

        return card;
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Event Listeners
    viewToggle.addEventListener('click', function() {
        currentView = currentView === 'grid' ? 'list' : 'grid';
        renderContacts(contacts);
        this.innerHTML = `<i class="ri-${currentView === 'grid' ? 'grid' : 'list'}-fill"></i> ${currentView === 'grid' ? 'Grid' : 'List'} View`;
    });

    sortToggle.addEventListener('click', function() {
        const sortOptions = document.createElement('div');
        sortOptions.className = 'sort-options';
        sortOptions.innerHTML = `
            <button data-sort="name">Sort by Name</button>
            <button data-sort="category">Sort by Category</button>
            <button data-sort="interaction">Sort by Last Interaction</button>
        `;
        this.parentNode.appendChild(sortOptions);

        sortOptions.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                sortContacts(e.target.dataset.sort);
                sortOptions.remove();
            }
        });

        document.addEventListener('click', function removeSortOptions(e) {
            if (!e.target.closest('.sort-options') && !e.target.closest('#nsortToggle')) {
                sortOptions.remove();
                document.removeEventListener('click', removeSortOptions);
            }
        });
    });

    // Sort contacts
    function sortContacts(criteria) {
        contacts.sort((a, b) => {
            switch(criteria) {
                    case 'name':
                    return a.name.localeCompare(b.name);
                    case 'category':
                    return a.category.localeCompare(b.category);
                    case 'interaction':
                    return new Date(b.lastInteraction) - new Date(a.lastInteraction);
                    default:
                    return 0;
            }
        });
        renderContacts(contacts);
    }

    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredContacts = contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.category.toLowerCase().includes(searchTerm) ||
            contact.email?.toLowerCase().includes(searchTerm)
        );
        renderFilteredContacts(filteredContacts);
    });

    function renderFilteredContacts(filteredContacts) {
        if (currentView === 'grid') {
            contactGrid.innerHTML = '';
            filteredContacts.forEach(contact => {
                contactGrid.appendChild(createContactCard(contact));
            });
        } else {
            contactList.innerHTML = '';
            filteredContacts.forEach(contact => {
                contactList.appendChild(createContactListItem(contact));
            });
        }
    }

    // Initialize
    fetchData();
    });
    