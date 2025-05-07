// Settings Modal functionality
document.addEventListener('DOMContentLoaded', function() {
    const settingsModal = document.getElementById('settingsModal');
    const settingsModalBtn = document.getElementById('settingsModalBtn');
    const closeBtn = document.querySelector('.close-button');
    const settingsItems = document.querySelectorAll('.settings-item');

    // Open modal with animation
    settingsModalBtn.addEventListener('click', function() {
        settingsModal.style.display = 'block';
        void settingsModal.offsetWidth;
        settingsModal.classList.add('show');
    });

    // Close modal with animation
    closeBtn.addEventListener('click', function() {
        settingsModal.classList.remove('show');
        setTimeout(() => {
            settingsModal.style.display = 'none';
        }, 300);
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            settingsModal.classList.remove('show');
            setTimeout(() => {
                settingsModal.style.display = 'none';
            }, 300);
        }
    });

    // Add hover effect to settings items
    settingsItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#1a1a1a' : '#f8f9fa';
        });

        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#2d2d2d' : '#fff';
        });
    });

    // Initialize all settings toggles
    const settingsToggles = [
        'darkModeToggle',
        'pushNotificationToggle',
        'emailNotificationToggle',
        'autoSaveToggle',
        'compactViewToggle',
        'sidebarToggle'
    ];

    settingsToggles.forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            // Load saved preference
            const savedValue = localStorage.getItem(toggleId);
            if (savedValue !== null) {
                toggle.checked = savedValue === 'true';
            }

            // Save preference on change
            toggle.addEventListener('change', function() {
                localStorage.setItem(toggleId, this.checked);
                // Special handling for dark mode toggle
                if (toggleId === 'darkModeToggle') {
                    toggleDarkMode(this.checked);
                }
            });
        }
    });

    // Function to toggle dark mode
    function toggleDarkMode(enabled) {
        // Toggle dark mode class on body
        document.body.classList.toggle('dark-mode', enabled);

        // Update background colors
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => {
            section.style.backgroundColor = enabled ? '#1a1a1a' : '#fff';
        });

        // Update text colors, excluding logo and its children
        const textElements = document.querySelectorAll('h1:not(.nav_logo h2), h2:not(.nav_logo h2), h3, h4, h5, h6, p, span, div:not(.nav_logo)');
        textElements.forEach(element => {
            element.style.color = enabled ? '#fff' : '#333';
        });

        // Update navigation background
        const nav = document.querySelector('nav');
        if (nav) {
            nav.style.backgroundColor = enabled ? '#2d2d2d' : '#fff';
        }

        // Update cards background
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.backgroundColor = enabled ? '#2d2d2d' : '#fff';
        });
    }

    // Initialize select elements
    const selectElements = [
        'exportFrequency'
    ];

    selectElements.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            // Load saved preference
            const savedValue = localStorage.getItem(selectId);
            if (savedValue) {
                select.value = savedValue;
            }

            // Save preference on change
            select.addEventListener('change', function() {
                localStorage.setItem(selectId, this.value);
                // Add visual feedback
                this.style.borderColor = '#007bff';
                this.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
                setTimeout(() => {
                    this.style.borderColor = document.body.classList.contains('dark-mode') ? '#444' : '#ddd';
                    this.style.boxShadow = 'none';
                }, 500);
            });
        }
    });

    // Apply dark mode on load if enabled
    if (localStorage.getItem('darkModeToggle') === 'true') {
        toggleDarkMode(true);
    }
});

// Search functionality
const searchBox = document.querySelector('.search-box');
const searchInput = document.querySelector('.input-search');
const searchButton = document.querySelector('.btn-search');

// Create search results dropdown
const searchResults = document.createElement('div');
searchResults.className = 'search-results';
searchBox.appendChild(searchResults);

// Initialize search functionality
function initSearch() {
    // Focus input when clicking the search button
    searchButton.addEventListener('click', () => {
        searchInput.focus();
    });

    // Handle input focus
    searchInput.addEventListener('focus', () => {
        searchBox.classList.add('active');
        searchInput.style.width = '300px';
        searchInput.style.padding = '10px 40px 10px 20px';
    });

    // Handle input blur
    searchInput.addEventListener('blur', () => {
        if (!searchInput.value) {
            searchBox.classList.remove('active');
            searchInput.style.width = '50px';
            searchInput.style.padding = '10px';
        }
    });

    // Handle search input
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        performSearch(searchTerm);
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target)) {
            searchResults.classList.remove('show');
        }
    });
}

// Perform search across the dashboard
function performSearch(searchTerm) {
    if (!searchTerm) {
        clearSearchResults();
        return;
    }

    const searchableItems = [
        // Main Sections
        { id: 'home', title: 'Dashboard', icon: 'ri-dashboard-line', type: 'section' },
        { id: 'tasks', title: 'Tasks', icon: 'ri-task-line', type: 'section' },
        { id: 'skills', title: 'Skills', icon: 'ri-briefcase-line', type: 'section' },
        { id: 'networking', title: 'Networking', icon: 'ri-group-line', type: 'section' },
        { id: 'settings', title: 'Settings', icon: 'ri-settings-3-line', type: 'section' },
        
        // Dashboard-related items
        { id: 'home', title: 'View Dashboard', icon: 'ri-dashboard-line', type: 'action' },
        { id: 'home', title: 'Task Progress', icon: 'ri-progress-1-line', type: 'action' },
        { id: 'home', title: 'Recent Activity', icon: 'ri-time-line', type: 'action' },
        
        // Task-related items
        { id: 'tasks', title: 'Add Task', icon: 'ri-add-line', type: 'action' },
        { id: 'tasks', title: 'View Tasks', icon: 'ri-list-check', type: 'action' },
        { id: 'tasks', title: 'Task Priority', icon: 'ri-flag-line', type: 'action' },
        { id: 'tasks', title: 'Task Due Date', icon: 'ri-calendar-line', type: 'action' },
        { id: 'tasks', title: 'Task Reminder', icon: 'ri-notification-line', type: 'action' },
        
        // Skills-related items
        { id: 'skills', title: 'Add Skill', icon: 'ri-add-line', type: 'action' },
        { id: 'skills', title: 'Skill Progress', icon: 'ri-progress-1-line', type: 'action' },
        { id: 'skills', title: 'Skill Level', icon: 'ri-bar-chart-line', type: 'action' },
        { id: 'skills', title: 'Skill Notes', icon: 'ri-file-list-line', type: 'action' },
        { id: 'skills', title: 'Skill Certificates', icon: 'ri-award-line', type: 'action' },
        
        // Networking-related items
        { id: 'networking', title: 'Add Contact', icon: 'ri-user-add-line', type: 'action' },
        { id: 'networking', title: 'View Contacts', icon: 'ri-contacts-line', type: 'action' },
        { id: 'networking', title: 'Network Goals', icon: 'ri-target-line', type: 'action' },
        { id: 'networking', title: 'Recent Interactions', icon: 'ri-message-2-line', type: 'action' },
        
        // Settings-related items
        { id: 'settingsModal', title: 'Open Settings', icon: 'ri-settings-3-line', type: 'action' },
        { id: 'settings', title: 'Dark Mode', icon: 'ri-moon-line', type: 'setting' },
        { id: 'settings', title: 'Notifications', icon: 'ri-notification-3-line', type: 'setting' },
        { id: 'settings', title: 'Data Export', icon: 'ri-download-line', type: 'setting' },
        { id: 'settings', title: 'Layout Settings', icon: 'ri-layout-line', type: 'setting' }
    ];

    const results = searchableItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.id.toLowerCase().includes(searchTerm) ||
        item.type.toLowerCase().includes(searchTerm)
    );

    displaySearchResults(results);
}

// Display search results
function displaySearchResults(results) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.classList.remove('show');
        return;
    }

    // Group results by type
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.type]) {
            acc[result.type] = [];
        }
        acc[result.type].push(result);
        return acc;
    }, {});

    // Create sections for each type
    Object.entries(groupedResults).forEach(([type, items]) => {
        const section = document.createElement('div');
        section.className = 'search-results-section';
        
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'search-results-title';
        sectionTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        section.appendChild(sectionTitle);

        items.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <i class="${result.icon}"></i>
                <span>${result.title}</span>
            `;

            resultItem.addEventListener('click', () => {
                if (result.id === 'settingsModal') {
                    // Open settings modal
                    const settingsModal = document.getElementById('settingsModal');
                    if (settingsModal) {
                        settingsModal.style.display = 'block';
                        setTimeout(() => {
                            settingsModal.classList.add('show');
                        }, 10);
                    }
                } else {
                    // Find the corresponding section
                    const section = document.getElementById(result.id);
                    if (section) {
                        // Hide all sections
                        document.querySelectorAll('.dashboard-section').forEach(s => {
                            s.classList.remove('active');
                        });
                        
                        // Show the selected section
                        section.classList.add('active');
                        
                        // Update navigation
                        document.querySelectorAll('.nav-item').forEach(item => {
                            item.classList.toggle('active', item.getAttribute('data-target') === result.id);
                        });

                        // Scroll to the section
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
                
                // Clear the search input and hide results
                searchInput.value = '';
                searchResults.classList.remove('show');
                searchBox.classList.remove('active');
                searchInput.style.width = '50px';
                searchInput.style.padding = '10px';
            });

            section.appendChild(resultItem);
        });

        searchResults.appendChild(section);
    });

    searchResults.classList.add('show');
}

// Clear search results
function clearSearchResults() {
    searchResults.innerHTML = '';
    searchResults.classList.remove('show');
}

// Initialize settings modal
function initSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    const closeButton = settingsModal.querySelector('.close-button');
    
    // Close modal when clicking the close button
    closeButton.addEventListener('click', () => {
        settingsModal.classList.remove('show');
        setTimeout(() => {
            settingsModal.style.display = 'none';
        }, 300);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
            setTimeout(() => {
                settingsModal.style.display = 'none';
            }, 300);
        }
    });
}

// Notification functionality
function initNotifications() {
    const notificationLink = document.querySelector('.notification-link');
    const notificationDropdown = document.querySelector('.notification-dropdown');
    const clearNotificationsBtn = document.querySelector('.clear-notifications');
    const pendingList = document.querySelector('.pending-list');
    const completedList = document.querySelector('.completed-list');

    // Only initialize if notification elements exist
    if (notificationLink && notificationDropdown) {
        // Toggle notification dropdown
        notificationLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
            // Refresh notifications when dropdown is opened
            if (notificationDropdown.classList.contains('show')) {
                fetchAndUpdateNotifications();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationLink.contains(e.target) && !notificationDropdown.contains(e.target)) {
                notificationDropdown.classList.remove('show');
            }
        });

        // Clear all notifications if button exists
        if (clearNotificationsBtn) {
            clearNotificationsBtn.addEventListener('click', () => {
                if (pendingList) pendingList.innerHTML = '';
                if (completedList) completedList.innerHTML = '';
                updateNotificationBadge(0);
                notificationDropdown.classList.remove('show');
            });
        }

        // Initial fetch of notifications
        fetchAndUpdateNotifications();
        
        // Set up periodic refresh (every 5 minutes)
        setInterval(fetchAndUpdateNotifications, 5 * 60 * 1000);
    }
}

async function fetchAndUpdateNotifications() {
    try {
        const response = await fetch('/dashboard_data');
        const data = await response.json();
        
        // Clear existing notifications
        const pendingList = document.querySelector('.pending-list');
        const completedList = document.querySelector('.completed-list');
        if (pendingList) pendingList.innerHTML = '';
        if (completedList) completedList.innerHTML = '';

        let totalNotifications = 0;

        // Add task notifications
        if (data.task_data) {
            // Add pending tasks
            if (data.task_data.pending_tasks_list && data.task_data.pending_tasks_list.length > 0) {
                totalNotifications += data.task_data.pending_tasks_list.length;
                data.task_data.pending_tasks_list.forEach(task => {
                    let message = '';
                    let dueText = task.due_date ? ` (Due: ${task.due_date})` : '';
                    let extraClass = '';
                    if (task.priority && task.priority.toLowerCase() === 'high') {
                        message = `⚠️ <b>${task.name}</b>${dueText} — <span style=\"color:#d32f2f\">You have forgotten this high priority task!</span>`;
                        extraClass = 'high-priority-notification';
                    } else if (task.priority && task.priority.toLowerCase() === 'medium') {
                        message = `🟡 <b>${task.name}</b>${dueText} — <span style=\"color:#b8860b\">This task needs your attention soon!</span>`;
                        extraClass = 'medium-priority-notification';
                    } else {
                        message = `<b>${task.name}</b>${dueText} — Don't forget to complete this task!`;
                    }
                    addNotification(message, 'pending', extraClass);
                });
            }

            // Add completed tasks
            if (data.task_data.completed > 0) {
                addNotification(
                    `You've completed ${data.task_data.completed} task${data.task_data.completed > 1 ? 's' : ''} (${data.task_data.completion_percentage}%)`,
                    'completed'
                );
            }
        }

        // Add in-progress skills notifications
        if (data.skill_data) {
            // Add in-progress skills
            if (data.skill_data.in_progress_skills_list && data.skill_data.in_progress_skills_list.length > 0) {
                totalNotifications += data.skill_data.in_progress_skills_list.length;
                data.skill_data.in_progress_skills_list.forEach(skill => {
                    let endDateText = skill.expectedEndDate ? ` (Ends: ${skill.expectedEndDate})` : '';
                    let message = `<b>${skill.name}</b>${endDateText} — Keep going, you're making progress!`;
                    addNotification(message, 'pending');
                });
            }

            // Add completed skills
            if (data.skill_data.completed > 0) {
                addNotification(
                    `You've completed ${data.skill_data.completed} skill${data.skill_data.completed > 1 ? 's' : ''} (${data.skill_data.completion_percentage}%)`,
                    'completed'
                );
            }
        }

        // Add upcoming meetings notifications
        if (data.network_data && data.network_data.upcoming_meetings && data.network_data.upcoming_meetings.length > 0) {
            totalNotifications += data.network_data.upcoming_meetings.length;
            data.network_data.upcoming_meetings.forEach(meeting => {
                if (meeting && meeting.contact_name) {
                    addNotification(
                        `Next meeting: ${meeting.contact_name}${meeting.next_meeting ? ` on ${new Date(meeting.next_meeting).toLocaleDateString()}` : ''}`,
                        'pending'
                    );
                }
            });
        }

        // Add incomplete goals notifications
        if (data.network_data && data.network_data.goals && data.network_data.goals.by_type) {
            Object.entries(data.network_data.goals.by_type).forEach(([type, typeData]) => {
                if (typeData.goals) {
                    const incompleteGoals = typeData.goals.filter(goal => goal.completed === 0);
                    totalNotifications += incompleteGoals.length;
                    if (incompleteGoals.length > 0) {
                        addNotification(
                            `You have ${incompleteGoals.length} incomplete ${type} goal${incompleteGoals.length > 1 ? 's' : ''}`,
                            'pending'
                        );
                    }
                }
            });
        }

        // If no notifications, show a message
        if (pendingList && pendingList.children.length === 0 && completedList && completedList.children.length === 0) {
            addNotification('No recent activities to show', 'completed');
        }

        // Update badge count with the total number of notifications
        updateNotificationBadge(totalNotifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        showToast('Failed to load notifications', 'error');
    }
}

function addNotification(message, type = 'pending', extraClass = '') {
    const notificationList = type === 'pending' 
        ? document.querySelector('.pending-list')
        : document.querySelector('.completed-list');
    
    if (notificationList) {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item' + (extraClass ? ' ' + extraClass : '');
        notificationItem.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
            </div>
        `;
        
        notificationList.appendChild(notificationItem);
    }
}

function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-link .badge');
    if (badge) {
        if (count !== undefined) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        } else {
            // Count notifications in the same way as the backend
            const pendingTasks = document.querySelectorAll('.pending-list .notification-item').length;
            const inProgressSkills = document.querySelectorAll('.pending-list .notification-item').length;
            const upcomingMeetings = document.querySelectorAll('.pending-list .notification-item').length;
            const incompleteGoals = document.querySelectorAll('.pending-list .notification-item').length;
            
            const totalNotifications = pendingTasks + inProgressSkills + upcomingMeetings + incompleteGoals;
            badge.textContent = totalNotifications;
            badge.style.display = totalNotifications > 0 ? 'flex' : 'none';
        }
    }
}

// Profile Section Functionality
function initProfileSection() {
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    const saveProfileBtn = document.querySelector('.save-profile-btn');
    const cancelProfileBtn = document.querySelector('.cancel-profile-btn');
    const profileInfo = document.querySelector('.profile-info');
    const profileForm = document.querySelector('.profile-form');

    if (editProfileBtn && profileInfo && profileForm) {
        editProfileBtn.addEventListener('click', () => {
            // Hide profile info and show form
            profileInfo.style.display = 'none';
            profileForm.style.display = 'block';
            
            // Focus on the first input field
            const firstInput = profileForm.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        });
    }

    if (saveProfileBtn && profileInfo && profileForm) {
        saveProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(profileForm);
            const profileData = {};
            formData.forEach((value, key) => {
                profileData[key] = value;
            });

            // Update profile info
            Object.entries(profileData).forEach(([key, value]) => {
                const infoElement = profileInfo.querySelector(`[data-field="${key}"]`);
                if (infoElement) {
                    infoElement.textContent = value;
                }
            });

            // Show success message
            showToast('Profile updated successfully', 'success');

            // Hide form and show profile info
            profileForm.style.display = 'none';
            profileInfo.style.display = 'block';
        });
    }

    if (cancelProfileBtn && profileInfo && profileForm) {
        cancelProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Hide form and show profile info
            profileForm.style.display = 'none';
            profileInfo.style.display = 'block';
        });
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Test Notification Button functionality
document.addEventListener('DOMContentLoaded', function() {
    const testNotificationBtn = document.getElementById('testNotificationBtn');
    
    if (testNotificationBtn) {
        testNotificationBtn.addEventListener('click', async function() {
            try {
                // Show loading state
                testNotificationBtn.disabled = true;
                testNotificationBtn.innerHTML = '<i class="ri-loader-4-line"></i> Sending...';
                
                // Send request to test notification endpoint
                const response = await fetch('/api/test-notification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Show success message
                    showNotification('Test notification sent successfully!', 'success');
                    
                    // Add flash message
                    const flashContainer = document.createElement('div');
                    flashContainer.className = 'flash-message success';
                    flashContainer.innerHTML = `
                        <div class="flash-content">
                            <i class="ri-check-line"></i>
                            <span>Test notification sent successfully! Check your email.</span>
                        </div>
                        <button class="flash-close">&times;</button>
                    `;
                    document.body.appendChild(flashContainer);
                    
                    // Show flash message
                    setTimeout(() => {
                        flashContainer.classList.add('show');
                    }, 100);
                    
                    // Remove flash message after 5 seconds
                    setTimeout(() => {
                        flashContainer.classList.remove('show');
                        setTimeout(() => {
                            flashContainer.remove();
                        }, 300);
                    }, 5000);
                    
                    // Add close button functionality
                    const closeBtn = flashContainer.querySelector('.flash-close');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            flashContainer.classList.remove('show');
                            setTimeout(() => {
                                flashContainer.remove();
                            }, 300);
                        });
                    }
                } else {
                    // Show error message
                    showNotification(data.message || 'Failed to send test notification', 'error');
                    
                    // Add error flash message
                    const flashContainer = document.createElement('div');
                    flashContainer.className = 'flash-message error';
                    flashContainer.innerHTML = `
                        <div class="flash-content">
                            <i class="ri-error-warning-line"></i>
                            <span>${data.message || 'Failed to send test notification'}</span>
                        </div>
                        <button class="flash-close">&times;</button>
                    `;
                    document.body.appendChild(flashContainer);
                    
                    // Show flash message
                    setTimeout(() => {
                        flashContainer.classList.add('show');
                    }, 100);
                    
                    // Remove flash message after 5 seconds
                    setTimeout(() => {
                        flashContainer.classList.remove('show');
                        setTimeout(() => {
                            flashContainer.remove();
                        }, 300);
                    }, 5000);
                    
                    // Add close button functionality
                    const closeBtn = flashContainer.querySelector('.flash-close');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            flashContainer.classList.remove('show');
                            setTimeout(() => {
                                flashContainer.remove();
                            }, 300);
                        });
                    }
                }
            } catch (error) {
                // Show error message
                showNotification('An error occurred while sending the test notification', 'error');
                
                // Add error flash message
                const flashContainer = document.createElement('div');
                flashContainer.className = 'flash-message error';
                flashContainer.innerHTML = `
                    <div class="flash-content">
                        <i class="ri-error-warning-line"></i>
                        <span>An error occurred while sending the test notification</span>
                    </div>
                    <button class="flash-close">&times;</button>
                `;
                document.body.appendChild(flashContainer);
                
                // Show flash message
                setTimeout(() => {
                    flashContainer.classList.add('show');
                }, 100);
                
                // Remove flash message after 5 seconds
                setTimeout(() => {
                    flashContainer.classList.remove('show');
                    setTimeout(() => {
                        flashContainer.remove();
                    }, 300);
                }, 5000);
                
                // Add close button functionality
                const closeBtn = flashContainer.querySelector('.flash-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        flashContainer.classList.remove('show');
                        setTimeout(() => {
                            flashContainer.remove();
                        }, 300);
                    });
                }
            } finally {
                // Reset button state
                testNotificationBtn.disabled = false;
                testNotificationBtn.innerHTML = '<i class="ri-mail-send-line"></i> Send Test Notification';
            }
        });
    }
});

// Function to show notification messages
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="ri-${type === 'success' ? 'check' : 'error'}-line"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initProfileSection();
    initNotifications();
    initSearch();
    initSettingsModal();
}); 