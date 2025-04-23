// external.js

document.addEventListener("DOMContentLoaded", async function () {
    const skillInput = document.getElementById("newSkill");
    const learningSourceInput = document.getElementById("learningSource");
    const startDateInput = document.getElementById("startDate");
    const expectedEndDateInput = document.getElementById("expectedEndDate");
    const skillList = document.getElementById("skillList");
    const addSkillButton = document.getElementById("addSkill");
    const cancelAddButton = document.getElementById("cancelAdd");
    const viewToggle = document.getElementById("sviewToggle");
    const sortToggle = document.getElementById("ssortToggle");
    const additionalInputs = document.querySelector(".additional-inputs");
    const initialInput = document.querySelector(".initial-input");
    const skillSuggestionsContainer = document.getElementById("skillSuggestions");
    const currentDateDisplay = document.getElementById("scurrentDate");

    const certificateModal = document.getElementById("certificateModal");
    const notesModal = document.getElementById("notesModal");
    const documentsModal = document.getElementById("documentsModal");
    const closeCertificateModal = certificateModal ? certificateModal.querySelector(".close-button") : null;
    const closeNotesModal = notesModal ? notesModal.querySelector(".close-button") : null;
    const closeDocumentsModal = documentsModal ? documentsModal.querySelector(".close-button") : null;
    const certificateURLInput = document.getElementById("certificateURL");
    const saveCertificateButton = document.getElementById("saveCertificate");
    const certificateSkillNameDisplay = document.getElementById("certificateSkillName");
    const notesSkillNameDisplay = document.getElementById("notesSkillName");
    const notesList = document.getElementById("notesList");
    const newNoteInput = document.getElementById("newNote");
    const saveNoteButton = document.getElementById("saveNoteButton");
    const documentsSkillNameDisplay = document.getElementById("documentsSkillName");
    const documentsList = document.getElementById("documentsList");
    const newDocumentURLInput = document.getElementById("newDocumentURL");
    const addDocumentButton = document.getElementById("addDocumentButton");
    const completionCertificateURLInput = document.getElementById("completionCertificateURL");
    const saveCertificateURLButton = document.getElementById("saveCertificateURLButton");
    const certificateDisplay = document.getElementById("certificateDisplay");
    const certificateLinkDisplay = document.getElementById("certificateLink");
    const uploadNewDocumentInput = document.getElementById("uploadNewDocument");
    const uploadDocumentButton = document.getElementById("uploadDocumentButton");

    let showAdditionalInputs = false;
    const recommendedSkills = ["Python", "JavaScript", "HTML", "CSS", "React", "Node.js", "Java", "C++", "SQL", "Data Analysis"];
    const recommendedSources = ["Coursera", "Udemy", "edX", "Pluralsight", "LinkedIn Learning", "Codecademy", "FreeCodeCamp", "YouTube"];
    let skillsData = [];
    let currentSkillIdForNotes = null;
    let currentSkillIdForDocuments = null;
    let currentSkillIdForCertificate = null;

    // --- Helper Functions ---

    // Display current date
    function updateCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateDisplay.textContent = now.toLocaleDateString(undefined, options);
    }
    updateCurrentDate();

    // Initialize Flatpickr
    flatpickr(".flatpickr", {
        dateFormat: "Y-m-d",
    });

    // Function to display suggestions
    function displaySuggestions(suggestions) {
        skillSuggestionsContainer.innerHTML = "";
        if (suggestions.length > 0 && skillInput === document.activeElement) {
            suggestions.forEach(skill => {
                const suggestionItem = document.createElement("div");
                suggestionItem.classList.add("suggestion-item");
                suggestionItem.textContent = skill;
                suggestionItem.addEventListener("click", function () {
                    skillInput.value = skill;
                    skillSuggestionsContainer.classList.remove("show");
                });
                skillSuggestionsContainer.appendChild(suggestionItem);
            });
            skillSuggestionsContainer.classList.add("show");
        } else {
            skillSuggestionsContainer.classList.remove("show");
        }
    }

    // Function to display source suggestions
    function displaySourceSuggestions(suggestions) {
        const sourceSuggestionsContainer = document.getElementById("sourceSuggestions");
        sourceSuggestionsContainer.innerHTML = "";
        if (suggestions.length > 0) {
            suggestions.forEach(source => {
                const suggestionItem = document.createElement("div");
                suggestionItem.classList.add("suggestion-item");
                suggestionItem.textContent = source;
                suggestionItem.addEventListener("click", function() {
                    document.getElementById("learningSource").value = source;
                    sourceSuggestionsContainer.classList.remove("show");
                });
                sourceSuggestionsContainer.appendChild(suggestionItem);
            });
            sourceSuggestionsContainer.classList.add("show");
        } else {
            sourceSuggestionsContainer.classList.remove("show");
        }
    }

    // Function to fetch skills from the API
    async function fetchSkills() {
        try {
            const response = await fetch('/api/skills');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            skillsData = data;
            renderSkills();
        } catch (error) {
            console.error('Error fetching skills:', error);
            alert('Could not load skills. Please try again.');
        }
    }

    // Function to find a skill object by its ID
    function findSkillObject(id) {
        return skillsData.find(skill => skill._id === id);
    }

    // Function to find a skill list item element by its ID
    function findSkillItem(id) {
        return skillList.querySelector(`[data-skill-id="${id}"]`);
    }

    // Function to update the display of a skill item
    function updateSkillDisplay(item, skill) {
        if (item) {
            const progressBar = item.querySelector(".progress-bar");
            const remainingElement = item.querySelector(".remaining-days");
            if (progressBar) {
                progressBar.style.width = `${skill.completed}%`;
            }
            if (remainingElement) {
                const endDate = new Date(skill.expectedEndDate);
                const today = new Date();
                const timeLeft = endDate.getTime() > today.getTime() ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 0;
                remainingElement.textContent = `Remaining: ${timeLeft} days`;
            }
            item.className = `skill-item ${skill.completed === 100 ? 'completed' : ''}`; // Update the class for color change
        } else {
            console.error("Error: Skill item not found for update display.");
        }
    }

    // Function to create a skill list item element
    function createSkillElement(skill) {
        const li = document.createElement("li");
        li.classList.add("skill-item");
        if (skill.completed === 100) {
            li.classList.add("completed");
        }
        li.dataset.skillId = skill._id;
        li.dataset.priority = skill.priority || 'medium';
        li.dataset.level = skill.level || 'beginner';
        
        const endDate = new Date(skill.expectedEndDate);
        const today = new Date();
        const timeLeft = endDate.getTime() > today.getTime() ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 0;
        
        const progressPercentage = skill.completed || 0;
        const progressClass = progressPercentage === 100 ? 'completed' : 
                            progressPercentage >= 75 ? 'high' :
                            progressPercentage >= 50 ? 'medium' :
                            progressPercentage >= 25 ? 'low' : 'very-low';

        li.innerHTML = `
            <div class="skill-details">
                <div class="skill-header">
                    <div class="skill-name ${skill.completed === 100 ? 'completed' : ''}">${skill.name}</div>
                    <div class="skill-meta">
                        <span class="skill-level ${skill.level}">${skill.level}</span>
                        <span class="skill-priority ${skill.priority}">${skill.priority}</span>
                    </div>
                </div>
                
                <div class="skill-progress-container">
                    <div class="skill-progress">
                        <div class="progress-bar ${progressClass}" style="width: ${progressPercentage}%"></div>
                    </div>
                    <span class="progress-text">${progressPercentage}%</span>
                </div>

                <div class="skill-info">
                    <div class="skill-meta">
                        <i class="ri-book-open-line"></i>
                        <span>From: ${skill.learningFrom}</span>
                    </div>
                    <div class="skill-meta">
                        <i class="ri-calendar-line"></i>
                        <span>Start: ${formatDate(skill.startDate)}</span>
                    </div>
                    <div class="skill-meta">
                        <i class="ri-timer-line"></i>
                        <span>End: ${formatDate(skill.expectedEndDate)}</span>
                    </div>
                    <div class="skill-meta remaining-days ${timeLeft < 7 ? 'urgent' : ''}">
                        <i class="ri-time-line"></i>
                        <span>${timeLeft} days remaining</span>
                    </div>
                </div>

                ${skill.tags && skill.tags.length > 0 ? `
                    <div class="skill-tags">
                        ${skill.tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="skill-actions">
                <button class="complete-button ${skill.completed === 100 ? 'completed' : ''}">
                    ${skill.completed === 100 ? 'Undo' : 'Complete'}
                </button>
                <button class="notes-button">
                    <i class="ri-sticky-note-line"></i>
                    <span class="notes-count">${skill.notes ? skill.notes.length : 0}</span>
                </button>
                <button class="documents-button">
                    <i class="ri-file-list-line"></i>
                    <span class="documents-count">${skill.documents ? skill.documents.length : 0}</span>
                </button>
                <button class="edit-button">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="delete-button">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        return li;
    }

    // Function to format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Function to render the skills list in the UI
    function renderSkills() {
        skillList.innerHTML = "";
        skillsData.forEach(skill => {
            const skillItem = createSkillElement(skill);
            skillItem.dataset.skillId = skill._id;
            skillList.appendChild(skillItem);
        });
    }

    // Function to reset the add skill input fields
    function resetInputFields() {
        skillInput.value = "";
        learningSourceInput.value = "";
        startDateInput.value = "";
        expectedEndDateInput.value = "";
        const fpStart = document.querySelector("#startDate")._flatpickr;
        if (fpStart) fpStart.clear();
        const fpEnd = document.querySelector("#expectedEndDate")._flatpickr;
        if (fpEnd) fpEnd.clear();
    }

    // Function to hide the additional input fields for adding a skill
    function hideAdditionalInputs() {
        additionalInputs.style.display = "none";
        initialInput.style.marginBottom = "0";
        addSkillButton.textContent = "Add Skill";
        cancelAddButton.style.display = "none";
        showAdditionalInputs = false;
    }

    // --- Event Listeners ---

    // Event listener for input changes to show skill suggestions
    skillInput.addEventListener("input", function () {
        const inputText = this.value.toLowerCase();
        const filteredSuggestions = recommendedSkills.filter(skill =>
            skill.toLowerCase().startsWith(inputText) && skill.toLowerCase() !== inputText
        );
        displaySuggestions(filteredSuggestions.slice(0, 5));
    });

    // Event listener to hide suggestions when the skill input loses focus
    skillInput.addEventListener("blur", function () {
        setTimeout(() => {
            skillSuggestionsContainer.classList.remove("show");
        }, 200);
    });

    // Event listener for the "Add Skill" button
    addSkillButton.addEventListener("click", async function () {
        if (!showAdditionalInputs) {
            additionalInputs.style.display = "flex";
            initialInput.style.marginBottom = "10px";
            addSkillButton.textContent = "Save Skill";
            cancelAddButton.style.display = "inline-block";
            showAdditionalInputs = true;
        } else {
            const skillName = skillInput.value.trim();
            const learningFrom = learningSourceInput.value.trim();
            const startDate = startDateInput.value;
            const expectedEndDate = expectedEndDateInput.value;

            if (skillName && learningFrom && startDate && expectedEndDate) {
                const newSkill = {
                    name: skillName,
                    learningFrom: learningFrom,
                    startDate: startDate,
                    expectedEndDate: expectedEndDate,
                    completed: 0,
                    completionCertificate: null,
                    notes: [],
                    documents: []
                };

                try {
                    const response = await fetch('/api/skills', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(newSkill),
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const savedSkill = await response.json();
                    skillsData.push(savedSkill);
                    const skillItem = createSkillElement(savedSkill);
                    skillItem.dataset.skillId = savedSkill._id;
                    skillList.appendChild(skillItem);
                    resetInputFields();
                    hideAdditionalInputs();
                } catch (error) {
                    console.error('Error adding skill:', error);
                    alert('Could not add skill. Please try again.');
                }
            } else {
                alert('Please fill in all the skill details.');
            }
        }
    });

    // Event listener for the "Cancel" button when adding a skill
    cancelAddButton.addEventListener("click", function () {
        resetInputFields();
        hideAdditionalInputs();
        skillSuggestionsContainer.classList.remove("show");
    });

    // Event listener for clicks on the skill list to handle actions
    skillList.addEventListener("click", async function (event) {
        const target = event.target;
        const skillItemElement = target.closest(".skill-item");
        if (!skillItemElement) return;
        const skillId = skillItemElement.dataset.skillId;

        if (target.classList.contains("delete-button") || target.closest(".delete-button")) {
            if (confirm('Are you sure you want to delete this skill?')) {
                try {
                    const response = await fetch(`/api/skills/${skillId}`, {
                        method: 'DELETE',
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    skillsData = skillsData.filter(skill => skill._id !== skillId);
                    skillItemElement.remove();
                } catch (error) {
                    console.error('Error deleting skill:', error);
                    alert('Could not delete skill. Please try again.');
                }
            }
        } else if (target.classList.contains("complete-button")) {
            const skillObject = findSkillObject(skillId);
            if (skillObject) {
                const newCompletedStatus = skillObject.completed === 0 ? 100 : 0;
                try {
                    const response = await fetch(`/api/skills/${skillId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ completed: newCompletedStatus }),
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const updatedSkill = await response.json();
                    const index = skillsData.findIndex(skill => skill._id === updatedSkill._id);
                    if (index !== -1) {
                        skillsData[index] = updatedSkill;
                    }
                    const updatedSkillItemElement = findSkillItem(skillId);
                    if (updatedSkillItemElement) {
                        updateSkillDisplay(updatedSkillItemElement, updatedSkill);
                        updatedSkillItemElement.querySelector(".skill-name").classList.toggle("completed", updatedSkill.completed === 100);
                        target.textContent = updatedSkill.completed === 100 ? 'Undo' : 'Complete';
                        if (updatedSkill.completed === 100) {
                            currentSkillIdForDocuments = skillId;
                            showDocumentsModal(updatedSkill);
                        }
                    } else {
                        console.error("Error: Could not find skill item after update.");
                    }
                } catch (error) {
                    console.error('Error updating skill:', error);
                    alert('Could not update skill. Please try again.');
                }
            }
        } else if (target.classList.contains("notes-button")) {
            const skillObject = findSkillObject(skillId);
            if (skillObject) {
                currentSkillIdForNotes = skillId;
                showNotesModal(skillObject);
            }
        } else if (target.classList.contains("documents-button")) {
            const skillObject = findSkillObject(skillId);
            if (skillObject) {
                currentSkillIdForDocuments = skillId;
                showDocumentsModal(skillObject);
            }
        }
    });

    // Event listener for toggling the view (list/grid)
    viewToggle.addEventListener("click", function () {
        skillList.classList.toggle("grid-view");
        skillList.classList.toggle("list-view");
    });

    // Event listener for sorting the skills alphabetically
    sortToggle.addEventListener("click", function () {
        const sortOptions = document.createElement("div");
        sortOptions.classList.add("sort-options");
        sortOptions.innerHTML = `
            <button data-sort="name">Sort by Name</button>
            <button data-sort="priority">Sort by Priority</button>
            <button data-sort="level">Sort by Level</button>
            <button data-sort="progress">Sort by Progress</button>
            <button data-sort="deadline">Sort by Deadline</button>
        `;
        this.parentNode.appendChild(sortOptions);

        sortOptions.addEventListener("click", function(e) {
            if (e.target.tagName === "BUTTON") {
                sortSkills(e.target.dataset.sort);
                sortOptions.remove();
            }
        });

        // Remove sort options when clicking outside
        document.addEventListener("click", function removeSortOptions(e) {
            if (!e.target.closest(".sort-options") && !e.target.closest("#ssortToggle")) {
                sortOptions.remove();
                document.removeEventListener("click", removeSortOptions);
            }
        });
    });

    // --- Notes Modal Logic ---
    function showNotesModal(skill) {
        notesSkillNameDisplay.textContent = skill.name;
        notesList.innerHTML = ''; // Clear previous notes
        skill.notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.classList.add('note-item');
            noteItem.innerHTML = `<p><strong class="note-date">${note.date}:</strong> ${note.content}</p>`;
            notesList.appendChild(noteItem);
        });
        newNoteInput.value = '';
        notesModal.classList.add("show");
    }

    saveNoteButton.addEventListener("click", async function () {
        if (currentSkillIdForNotes) {
            const noteContent = newNoteInput.value.trim();
            if (noteContent) {
                const skill = findSkillObject(currentSkillIdForNotes);
                if (skill) {
                    const today = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD format
                    const newNote = { date: today, content: noteContent };
                    skill.notes.push(newNote);
                    try {
                        const response = await fetch(`/api/skills/${currentSkillIdForNotes}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ notes: skill.notes }),
                        });
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const updatedSkill = await response.json();
                        const index = skillsData.findIndex(s => s._id === updatedSkill._id);
                        if (index !== -1) {
                            skillsData[index] = updatedSkill;
                        }
                        showNotesModal(updatedSkill); // Refresh the notes display
                    } catch (error) {
                        console.error('Error saving note:', error);
                        alert('Could not save note. Please try again.');
                    }
                    newNoteInput.value = '';
                }
            }
        }
    });

    if (closeNotesModal) {
        closeNotesModal.addEventListener("click", function () {
            notesModal.classList.remove("show");
            currentSkillIdForNotes = null;
        });
    }

    // --- Documents Modal Logic ---
    function showDocumentsModal(skill) {
        // First check if the modal exists
        const documentsModalElement = document.getElementById("documentsModal");
        if (!documentsModalElement) {
            console.error("Error: Documents modal not found in the DOM");
            return;
        }

        // Update skill name
        const documentsSkillNameDisplay = document.getElementById("documentsSkillName");
        if (documentsSkillNameDisplay) {
            documentsSkillNameDisplay.textContent = skill.name;
        }

        // Handle certificate display
        const certificateDisplay = document.getElementById("certificateDisplay");
        const certificateLinkDisplay = document.getElementById("certificateLink");
        const deleteCertificateButton = document.getElementById("deleteCertificateButton");
        
        if (certificateDisplay && certificateLinkDisplay && deleteCertificateButton) {
            if (skill.completionCertificate) {
                certificateLinkDisplay.textContent = skill.completionCertificate.split('/').pop();
                certificateLinkDisplay.href = skill.completionCertificate;
                certificateDisplay.style.display = "block";
                deleteCertificateButton.style.display = "flex";
            } else {
                certificateLinkDisplay.textContent = "No certificate added";
                certificateLinkDisplay.href = "#";
                certificateDisplay.style.display = "block";
                deleteCertificateButton.style.display = "none";
            }
        }

        // Handle documents list
        const documentsListElement = document.getElementById("documentsList");
        if (documentsListElement) {
            documentsListElement.innerHTML = ''; // Clear previous documents
            if (skill.documents && skill.documents.length > 0) {
                skill.documents.forEach((docURL, index) => {
                    const listItem = document.createElement('div');
                    listItem.classList.add('document-item');
                    
                    const docLink = document.createElement('a');
                    docLink.href = docURL;
                    docLink.textContent = docURL.split('/').pop();
                    docLink.target = "_blank";
                    
                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('delete-document-button');
                    deleteButton.innerHTML = '<i class="ri-delete-bin-line"></i>';
                    deleteButton.onclick = () => deleteDocument(skill._id, index);
                    
                    listItem.appendChild(docLink);
                    listItem.appendChild(deleteButton);
                    documentsListElement.appendChild(listItem);
                });
            }
        }

        // Show the modal
        documentsModalElement.classList.add("show");
    }
    
    // Add event listener for certificate upload
    document.getElementById("uploadCertificateButton").addEventListener("click", async function() {
        const file = document.getElementById("uploadCertificate").files[0];
        if (!file) {
            alert('Please select a certificate file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('document', file);
        formData.append('skillId', currentSkillIdForDocuments);
        formData.append('isCertificate', 'true'); // Flag to indicate this is a certificate

        try {
            const response = await fetch('/api/upload_document', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const skill = findSkillObject(currentSkillIdForDocuments);
            if (skill) {
                skill.completionCertificate = result.url;
                const index = skillsData.findIndex(s => s._id === currentSkillIdForDocuments);
                if (index !== -1) {
                    skillsData[index] = skill;
                }
                showDocumentsModal(skill);
                alert('Certificate uploaded successfully!');
            }
        } catch (error) {
            console.error('Error uploading certificate:', error);
            alert('Could not upload certificate. Please try again.');
        }
    });
    
    // Add event listener for certificate deletion
    document.getElementById("deleteCertificateButton").addEventListener("click", async function() {
        if (!confirm('Are you sure you want to delete this certificate?')) {
            return;
        }

        try {
            const skill = findSkillObject(currentSkillIdForDocuments);
            if (skill) {
                skill.completionCertificate = null;
                const response = await fetch(`/api/skills/${currentSkillIdForDocuments}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ completionCertificate: null }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const updatedSkill = await response.json();
                const index = skillsData.findIndex(s => s._id === updatedSkill._id);
                if (index !== -1) {
                    skillsData[index] = updatedSkill;
                }
                showDocumentsModal(updatedSkill);
                alert('Certificate deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting certificate:', error);
            alert('Could not delete certificate. Please try again.');
        }
    });

    // Add event listener for document upload
    document.getElementById("uploadDocumentButton").addEventListener("click", async function() {
        const file = document.getElementById("uploadNewDocument").files[0];
        if (!file) {
            alert('Please select a document to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('document', file);
        formData.append('skillId', currentSkillIdForDocuments);

        try {
            const response = await fetch('/api/upload_document', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const skill = findSkillObject(currentSkillIdForDocuments);
            if (skill) {
                if (!skill.documents) {
                    skill.documents = [];
                }
                skill.documents.push(result.url);
                const index = skillsData.findIndex(s => s._id === currentSkillIdForDocuments);
                if (index !== -1) {
                    skillsData[index] = skill;
                }
                showDocumentsModal(skill);
                alert('Document uploaded successfully!');
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Could not upload document. Please try again.');
        }
    });

    // Function to handle document deletion
    async function deleteDocument(skillId, documentIndex) {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            const skill = findSkillObject(skillId);
            if (skill && skill.documents && skill.documents[documentIndex]) {
                skill.documents.splice(documentIndex, 1);
                const response = await fetch(`/api/skills/${skillId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ documents: skill.documents }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const updatedSkill = await response.json();
                const index = skillsData.findIndex(s => s._id === updatedSkill._id);
                if (index !== -1) {
                    skillsData[index] = updatedSkill;
                }
                showDocumentsModal(updatedSkill);
                alert('Document deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Could not delete document. Please try again.');
        }
    }
    
    if (closeDocumentsModal) {
        closeDocumentsModal.addEventListener("click", function () {
            const documentsModalElement = document.getElementById("documentsModal");
            if (documentsModalElement) {
                documentsModalElement.classList.remove("show");
            }
            currentSkillIdForDocuments = null;
        });
    }
    
    // --- Certificate Modal Logic (Potentially Redundant) ---
    function showCertificateModal(skill) {
        certificateSkillNameDisplay.textContent = skill.name;
        certificateURLInput.value = skill.completionCertificate || '';
        certificateModal.classList.add("show");
        currentSkillIdForCertificate = skill._id;
    }
    
    saveCertificateButton.addEventListener("click", async function () {
        if (currentSkillIdForCertificate) {
            const certificateURL = certificateURLInput.value.trim();
            const skill = findSkillObject(currentSkillIdForCertificate);
            if (skill) {
                try {
                    const response = await fetch(`/api/skills/${currentSkillIdForCertificate}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ completionCertificate: certificateURL }),
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const updatedSkill = await response.json();
                    const index = skillsData.findIndex(s => s._id === updatedSkill._id);
                    if (index !== -1) {
                        skillsData[index] = updatedSkill;
                    }
                    certificateModal.classList.remove("show");
                    alert(`Certificate saved for ${skill.name}!`);
                    const documentsSkill = findSkillObject(currentSkillIdForCertificate);
                    if (documentsSkill) {
                        showDocumentsModal(documentsSkill); // Update documents modal if it's open
                    }
                } catch (error) {
                    console.error('Error saving certificate:', error);
                    alert('Could not save certificate. Please try again.');
                }
            }
        }
    });
    
    if (closeCertificateModal) {
        closeCertificateModal.addEventListener("click", function () {
            certificateModal.classList.remove("show");
        });
    }
    
    // --- General Modal Closing on Outside Click ---
    window.addEventListener("click", function (event) {
        if (event.target === notesModal) {
            notesModal.classList.remove("show");
            currentSkillIdForNotes = null;
        }
        const documentsModalElement = document.getElementById("documentsModal");
        if (event.target === documentsModalElement) {
            documentsModalElement.classList.remove("show");
            currentSkillIdForDocuments = null;
        }
        if (event.target === certificateModal) {
            certificateModal.classList.remove("show");
        }
    });
    
    // Initial fetch of skills on load
    await fetchSkills();
    renderSkills(); // Ensure initial rendering

    // Add event listener for learning source input
    document.getElementById("learningSource").addEventListener("input", function() {
        const inputText = this.value.toLowerCase();
        const filteredSuggestions = recommendedSources.filter(source =>
            source.toLowerCase().includes(inputText)
        );
        displaySourceSuggestions(filteredSuggestions);
    });

    // Add event listener for skill tags input
    document.getElementById("skillTags").addEventListener("keydown", function(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tags = this.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            this.value = tags.join(', ');
        }
    });

    // Function to handle skill editing
    async function editSkill(skillId) {
        const skill = findSkillObject(skillId);
        if (!skill) return;

        // Populate the form with skill data
        document.getElementById("newSkill").value = skill.name;
        document.getElementById("startDate").value = skill.startDate;
        document.getElementById("expectedEndDate").value = skill.expectedEndDate;
        document.getElementById("learningSource").value = skill.learningFrom;
        document.getElementById("skillLevel").value = skill.level;
        document.getElementById("skillPriority").value = skill.priority;
        document.getElementById("skillTags").value = skill.tags ? skill.tags.join(', ') : '';

        // Show the form
        document.querySelector(".additional-inputs").style.display = "flex";
        document.querySelector(".initial-input").style.marginBottom = "10px";
        document.getElementById("addSkill").textContent = "Update Skill";
        document.getElementById("cancelAdd").style.display = "inline-block";

        // Update the add skill button to handle updates
        const addButton = document.getElementById("addSkill");
        const originalClickHandler = addButton.onclick;
        addButton.onclick = async function() {
            const updatedSkill = {
                name: document.getElementById("newSkill").value.trim(),
                startDate: document.getElementById("startDate").value,
                expectedEndDate: document.getElementById("expectedEndDate").value,
                learningFrom: document.getElementById("learningSource").value.trim(),
                level: document.getElementById("skillLevel").value,
                priority: document.getElementById("skillPriority").value,
                tags: document.getElementById("skillTags").value.split(',').map(tag => tag.trim()).filter(tag => tag),
                completed: skill.completed,
                notes: skill.notes,
                documents: skill.documents
            };

            try {
                const response = await fetch(`/api/skills/${skillId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedSkill),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const updatedSkillData = await response.json();
                const index = skillsData.findIndex(s => s._id === updatedSkillData._id);
                if (index !== -1) {
                    skillsData[index] = updatedSkillData;
                }
                renderSkills();
                resetInputFields();
                hideAdditionalInputs();
                addButton.onclick = originalClickHandler;
            } catch (error) {
                console.error('Error updating skill:', error);
                alert('Could not update skill. Please try again.');
            }
        };
    }

    // Add event listener for edit button
    document.addEventListener("click", function(e) {
        if (e.target.closest(".edit-button")) {
            const skillItem = e.target.closest(".skill-item");
            const skillId = skillItem.dataset.skillId;
            editSkill(skillId);
        }
    });

    // Function to handle skill sorting
    function sortSkills(criteria) {
        const skills = Array.from(skillList.children);
        skills.sort((a, b) => {
            switch(criteria) {
                case 'name':
                    return a.querySelector(".skill-name").textContent.localeCompare(b.querySelector(".skill-name").textContent);
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.dataset.priority] - priorityOrder[b.dataset.priority];
                case 'level':
                    const levelOrder = { advanced: 0, intermediate: 1, beginner: 2 };
                    return levelOrder[a.dataset.level] - levelOrder[b.dataset.level];
                case 'progress':
                    const progressA = parseInt(a.querySelector(".progress-text").textContent);
                    const progressB = parseInt(b.querySelector(".progress-text").textContent);
                    return progressB - progressA;
                case 'deadline':
                    const daysA = parseInt(a.querySelector(".remaining-days").textContent);
                    const daysB = parseInt(b.querySelector(".remaining-days").textContent);
                    return daysA - daysB;
                default:
                    return 0;
            }
        });
        skillList.innerHTML = "";
        skills.forEach(skill => skillList.appendChild(skill));
    }
});