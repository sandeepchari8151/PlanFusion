document.addEventListener("DOMContentLoaded", function () {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    const navItems = $$('.nav-item');
    const dashboardSections = $$('.dashboard-section');
    const tabButtons = $$(".card-buttons button");
    const tabSections = $$(".tabbed-details-card .card-section");
    const editBtn = $('#editProfileBtn');
    const profileModal = $('#profileModal');
    const form = $("#editProfileForm");
    const avatar = $('#profileAvatar');
    const fileInput = $('#avatarUpload');
    const socialDisplay = $(".card-social.social-display");
    const socialEdit = $(".card-social.social-edit");
    const block1Card = $(".card.block-1");
    const block2Card = $(".card.block-2");
    const editableElements = $$('.editable');
    const socialEditInputs = socialEdit?.querySelectorAll("input") || [];

    // Get all necessary elements for modal
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');
    const closeBtn = document.querySelector('.close-button');
    const cancelBtn = document.querySelector('.cancel-button');
    const saveBtn = document.querySelector('.save-button');
    const avatarInput = document.getElementById('editAvatar');
    const avatarPreview = document.getElementById('profileAvatar');
    
    // State
    let isEditing = false;
    let originalValues = {};
    let socialEditEnabledByFocus = false;

    // Function to adjust card height based on content
    function adjustCardHeight(cardElement) {
        if (cardElement) {
            cardElement.style.height = 'auto';
            cardElement.style.height = `${cardElement.offsetHeight}px`;
        }
    }

    // Listen for input changes in editable elements within block-1
    block1Card?.querySelectorAll('.editable').forEach(editable => {
        editable.addEventListener('input', debounce(() => adjustCardHeight(block1Card), 150));
    });

    // Listen for input changes in editable elements within block-2
    block2Card?.querySelectorAll('.editable').forEach(editable => {
        editable.addEventListener('input', debounce(() => adjustCardHeight(block2Card), 150));
    });

    // Listen for input changes in social edit fields
    socialEditInputs.forEach(input => {
        input.addEventListener('input', debounce(() => adjustCardHeight(block1Card), 150));
    });

    // Navigation switching
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const targetId = this.dataset.target;
            dashboardSections.forEach(section => section.classList.remove('active'));
            $('#' + targetId)?.classList.add('active');

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            adjustCardHeight(block1Card);
            adjustCardHeight(block2Card);
        });
    });

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const target = button.dataset.section;
            tabButtons.forEach(btn => btn.classList.remove("is-active"));
            tabSections.forEach(sec => sec.classList.remove("is-active"));
            button.classList.add("is-active");
            $(target)?.classList.add("is-active");

            adjustCardHeight(block1Card);
            adjustCardHeight(block2Card);
        });
    });

    // Initial height adjustment on load
    adjustCardHeight(block1Card);
    adjustCardHeight(block2Card);

    // Debounced resize
    window.addEventListener('resize', debounce(() => {
        adjustCardHeight(block1Card);
        adjustCardHeight(block2Card);
    }, 150));

    // Function to switch to edit mode for social URLs
    function enableSocialEdit() {
        if (socialDisplay && socialEdit) {
            socialDisplay.style.display = "none";
            socialEdit.style.display = "block";
            adjustCardHeight(block1Card);
        }
    }

    // Function to switch back to display mode for social URLs
    function disableSocialEdit() {
        if (socialDisplay && socialEdit) {
            socialDisplay.style.display = "block";
            socialEdit.style.display = "none";
            adjustCardHeight(block1Card);
        }
    }

    // Listen for focus on editable fields to potentially enable social URL editing
    document.querySelectorAll('.editable').forEach(el => {
        el.addEventListener('focus', () => {
            socialEditEnabledByFocus = true;
            enableSocialEdit();
        });

        el.addEventListener('blur', () => {
            const activeElement = document.activeElement;
            const isEditing = activeElement === editBtn || 
                            activeElement.closest('#editProfileForm') ||
                            activeElement.closest('.editable');
            
            if (!isEditing) {
                socialEditEnabledByFocus = false;
                disableSocialEdit();
            }
        });
    });

    // Listen for focus on modal inputs/textareas to enable social edit
    if (form) {
        form.querySelectorAll('input, textarea').forEach(el => {
            el.addEventListener('focus', () => {
                socialEditEnabledByFocus = true;
                enableSocialEdit();
            });

            el.addEventListener('blur', () => {
                const activeElement = document.activeElement;
                const isEditing = activeElement === editBtn || 
                                activeElement.closest('#editProfileForm') ||
                                activeElement.closest('.editable');
                
                if (!isEditing) {
                    socialEditEnabledByFocus = false;
                    disableSocialEdit();
                }
            });
        });
    }
    
    // Function to open modal
    function openModal() {
        if (!editProfileModal) {
            console.error('Modal element not found');
            return;
        }
        
        // Store original values
        originalValues = {
            fullName: document.querySelector('.card-fullname')?.textContent.trim() || '',
            jobTitle: document.querySelector('.card-jobtitle')?.textContent.trim() || '',
            bio: document.querySelector('.card-desc')?.textContent.trim() || '',
            address: document.querySelector('.contact-address .contact-text')?.textContent.trim() || '',
            phone: document.querySelector('.contact-phone .contact-text')?.textContent.trim() || '',
            email: document.querySelector('.contact-email .contact-text')?.textContent.trim() || '',
            linkedin: document.querySelector('.card-social a[href*="linkedin"]')?.getAttribute('href') || '',
            twitter: document.querySelector('.card-social a[href*="twitter"]')?.getAttribute('href') || '',
            instagram: document.querySelector('.card-social a[href*="instagram"]')?.getAttribute('href') || '',
            facebook: document.querySelector('.card-social a[href*="facebook"]')?.getAttribute('href') || ''
        };
        
        // Populate form fields
        if (editProfileForm) {
            editProfileForm["full_name"].value = originalValues.fullName;
            editProfileForm["job_title"].value = originalValues.jobTitle;
            editProfileForm["bio"].value = originalValues.bio;
            editProfileForm["address"].value = originalValues.address;
            editProfileForm["phone"].value = originalValues.phone;
            editProfileForm["email"].value = originalValues.email;
            editProfileForm["linkedin_url"].value = originalValues.linkedin;
            editProfileForm["twitter_url"].value = originalValues.twitter;
            editProfileForm["instagram_url"].value = originalValues.instagram;
            editProfileForm["facebook_url"].value = originalValues.facebook;
        }
        
        // Show modal
        editProfileModal.style.display = 'block';
        setTimeout(() => {
            editProfileModal.classList.add('show');
        }, 10);
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = editProfileForm?.querySelector('input, textarea');
        if (firstInput) firstInput.focus();

        // Add avatar change message in edit profile modal
        const avatarSection = editProfileModal.querySelector('.avatar-section');
        if (avatarSection) {
            const existingMessage = avatarSection.querySelector('.avatar-message');
            if (!existingMessage) {
                const avatarMessage = document.createElement('p');
                avatarMessage.className = 'avatar-message';
                avatarMessage.textContent = 'You can change your avatar by clicking on it in the profile section';
                avatarMessage.style.marginTop = '10px';
                avatarMessage.style.fontSize = '14px';
                avatarMessage.style.color = '#666';
                avatarMessage.style.textAlign = 'center';
                avatarSection.appendChild(avatarMessage);
            }
        }
    }
    
    // Function to close modal
    function closeModal() {
        if (!editProfileModal) {
            console.error('Modal element not found');
            return;
        }
        
        // Hide modal
        editProfileModal.classList.remove('show');
        setTimeout(() => {
            editProfileModal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
        
        // Reset form values to original state
        if (editProfileForm) {
            editProfileForm["full_name"].value = originalValues.fullName;
            editProfileForm["job_title"].value = originalValues.jobTitle;
            editProfileForm["bio"].value = originalValues.bio;
            editProfileForm["address"].value = originalValues.address;
            editProfileForm["phone"].value = originalValues.phone;
            editProfileForm["email"].value = originalValues.email;
            editProfileForm["linkedin_url"].value = originalValues.linkedin;
            editProfileForm["twitter_url"].value = originalValues.twitter;
            editProfileForm["instagram_url"].value = originalValues.instagram;
            editProfileForm["facebook_url"].value = originalValues.facebook;
        }
        
        // Remove avatar message when closing modal
        const avatarMessage = editProfileModal.querySelector('.avatar-message');
        if (avatarMessage) {
            avatarMessage.remove();
        }
    }
    
    // Function to save profile changes
    function saveProfileChanges() {
        if (!editProfileForm) return;

        // Get form data
        const formData = new FormData(editProfileForm);
        const profileData = {};
        formData.forEach((value, key) => {
            profileData[key] = value;
        });

        // Update profile display
        const updateElement = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = value;
        };

        // Update profile information
        updateElement('.card-fullname', profileData.full_name);
        updateElement('.card-jobtitle', profileData.job_title);
        updateElement('.card-desc', profileData.bio);
        updateElement('.contact-address .contact-text', profileData.address);
        updateElement('.contact-phone .contact-text', profileData.phone);
        updateElement('.contact-email .contact-text', profileData.email);

        // Update social media links
        const updateSocialLink = (platform, url) => {
            const link = document.querySelector(`.card-social a[href*="${platform}"]`);
            if (link) link.href = url;
        };

        updateSocialLink('linkedin', profileData.linkedin_url);
        updateSocialLink('twitter', profileData.twitter_url);
        updateSocialLink('instagram', profileData.instagram_url);
        updateSocialLink('facebook', profileData.facebook_url);

        // Show success message
        showAlert('Profile updated successfully', 'success');

        // Close modal
        closeModal();
    }

    // Function to show alert
    function showAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        // Show alert
        setTimeout(() => {
            alert.classList.add('show');
        }, 100);
        
        // Remove alert after 3 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(alert);
            }, 300);
        }, 3000);
    }

    // Event Listeners
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveProfileChanges();
        });
    }

    // Remove avatar upload from edit profile modal
    if (avatarInput && avatarPreview) {
        // Remove the file input element
        avatarInput.remove();
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editProfileModal) {
            closeModal();
        }
    });

    // Handle form submission
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfileChanges();
        });
    }

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Adjust height after initial content load
    window.addEventListener('load', () => {
        adjustCardHeight(block1Card);
        adjustCardHeight(block2Card);
    });

    // Initialize
    initializeProfile();
    setupEventListeners();
    setupAvatarUpload();
    setupSocialMediaLinks();

    function initializeProfile() {
        editableElements.forEach(el => {
            originalValues[el.dataset.field || el.className] = el.textContent.trim();
        });
        updateSocialMediaDisplay();
    }

    function setupEventListeners() {
        editableElements.forEach(el => {
            el.addEventListener('focus', () => {
                if (!isEditing) {
                    enterEditMode();
                }
            });
        });
    }

    function setupAvatarUpload() {
        avatar?.addEventListener('click', () => {
            fileInput?.click();
        });

        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const formData = new FormData();
                    formData.append('avatar', file);

                    const response = await fetch('/upload_avatar', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    if (data.success) {
                        const timestamp = new Date().getTime();
                        const newAvatarUrl = `${data.avatar_url}?t=${timestamp}`;
                        
                        // Update main profile avatar
                        avatar.src = newAvatarUrl;
                        
                        // Update navigation profile avatar
                        const navProfile = document.querySelector('.nav-profile');
                        if (navProfile) {
                            const navAvatar = navProfile.querySelector('img');
                            if (navAvatar) {
                                navAvatar.src = newAvatarUrl;
                            }
                        }
                        showAlert('Avatar updated successfully!', 'success');
                    } else {
                        showAlert('Failed to update avatar', 'danger');
                    }
                } catch (error) {
                    console.error('Error uploading avatar:', error);
                    showAlert('Error uploading avatar', 'danger');
                }
            }
        });
    }

    function setupSocialMediaLinks() {
        socialDisplay?.addEventListener('click', () => {
            if (!isEditing) {
                socialDisplay.style.display = 'none';
                socialEdit.style.display = 'block';
                enterEditMode();
            }
        });

        socialEditInputs.forEach(input => {
            input.addEventListener('input', () => {
                validateSocialUrl(input);
            });
        });
    }

    function validateSocialUrl(input) {
        const url = input.value.trim();
        const platform = input.dataset.field.split('_')[0];
        const isValid = validateUrlForPlatform(url, platform);
        
        input.style.borderColor = isValid ? '#ccc' : '#ff4444';
        return isValid;
    }

    function validateUrlForPlatform(url, platform) {
        if (!url) return true;
        const patterns = {
            linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
            twitter: /^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/,
            instagram: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_]+\/?$/,
            facebook: /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9.]+\/?$/
        };
        return patterns[platform]?.test(url) || false;
    }

    function enterEditMode() {
        isEditing = true;
        editableElements.forEach(el => {
            el.contentEditable = true;
            el.classList.add('editing');
        });
    }

    function updateSocialMediaDisplay() {
        if (socialDisplay && socialEdit) {
            socialDisplay.style.display = 'block';
            socialEdit.style.display = 'none';
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const editableElements = document.querySelectorAll('.editable');

    editableElements.forEach(element => {
        const placeholder = element.getAttribute('data-placeholder');

        function checkPlaceholder() {
            if (element.textContent.trim() === '') {
                element.textContent = placeholder;
                element.classList.add('placeholder');
            } else {
                element.classList.remove('placeholder');
            }
        }

        element.addEventListener('focus', function() {
            if (element.classList.contains('placeholder')) {
                element.textContent = '';
                element.classList.remove('placeholder');
            }
        });

        element.addEventListener('blur', checkPlaceholder);

        // Initial check
        checkPlaceholder();
    });
});