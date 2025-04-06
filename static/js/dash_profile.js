document.addEventListener("DOMContentLoaded", function () {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  const navItems = $$('.nav-item');
  const dashboardSections = $$('.dashboard-section');
  const tabButtons = $$(".card-buttons button");
  const tabSections = $$(".tabbed-details-card .card-section");
  const editBtn = $('#editProfileBtn');
  const profileModal = $('#profileModal');
  const cancelBtn = $('#cancelEdit');
  const form = $("#editProfileForm");
  const saveWrapper = $("#saveProfileWrapper");
  const saveButton = $("#saveProfileChanges");
  const profileForm = $("#profileForm");
  const avatar = $('#profileAvatar');
  const fileInput = $('#avatarUpload');

  // Navigation switching
  navItems.forEach(item => {
    item.addEventListener('click', function () {
      const targetId = this.dataset.target;
      dashboardSections.forEach(section => section.classList.remove('active'));
      $('#' + targetId)?.classList.add('active');

      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      setEqualCardHeight();
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

      setEqualCardHeight();
    });
  });

  // Initial height set
  if ($(".card-buttons button.is-active")) setEqualCardHeight();

  // Debounced resize
  window.addEventListener('resize', debounce(setEqualCardHeight, 150));

  // Inline editable changes trigger save
  $$('.editable').forEach(el => {
    ['input', 'focus'].forEach(evt => el.addEventListener(evt, showSaveButton));
  });

  // Modal open + prefill
  editBtn?.addEventListener('click', () => {
    if (profileModal) {
      profileModal.style.display = 'flex';
      $('#fullNameInput').value = $('.card-fullname')?.innerText || '';
      $('#jobTitleInput').value = $('.card-jobtitle')?.innerText || '';
      $('#bioInput').value = $('.card-desc')?.innerText || '';

      const contacts = $$('#contact .card-contact');
      $('#addressInput').value = contacts[0]?.innerText.trim() || '';
      $('#phoneInput').value = contacts[1]?.innerText.trim() || '';
      $('#emailInput').value = contacts[2]?.innerText.trim() || '';
    }
  });

  // Modal input changes
  form?.addEventListener('input', showSaveButton);

  // Modal cancel
  cancelBtn?.addEventListener('click', () => {
    if (profileModal) profileModal.style.display = 'none';
    if (saveWrapper) saveWrapper.style.display = 'none';
  });

  // Form submit
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    updateHiddenFormFields();
    submitProfileForm();
  });

  // Inline save button
  saveButton?.addEventListener('click', () => {
    updateHiddenFormFields();
    submitProfileForm();
  });

  // Avatar upload
  // Avatar upload
avatar?.addEventListener('click', () => {
  if (!fileInput.disabled) {  // Disable file input while upload is in progress
    fileInput.click();
  }
});

fileInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      avatar.src = event.target.result;
    };
    reader.readAsDataURL(file);

    showSaveButton();

    // Disable the file input to prevent multiple uploads
    fileInput.disabled = true;

    const formData = new FormData();
    formData.append('avatar', file);

    fetch('/upload-avatar', {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.avatar_url) {
          avatar.src = `${data.avatar_url}?t=${Date.now()}`;  // Cache-bust the avatar
          showAlert("Avatar updated!", "success");
        } else {
          showAlert("Avatar upload failed.", "danger");
        }
      })
      .catch(err => {
        console.error("Avatar upload error:", err);
        showAlert("Avatar upload failed.", "danger");
      })
      .finally(() => {
        // Re-enable file input after upload is done
        fileInput.disabled = false;
      });
  }
});


  // Show save button
  function showSaveButton() {
    if (saveWrapper) {
      saveWrapper.style.display = "block";
    }
  }

  // Hidden form field sync
  function updateHiddenFormFields() {
    const getText = (selector) => $(selector)?.innerText.trim() || "";

    profileForm["full_name"].value = getText(".card-fullname");
    profileForm["job_title"].value = getText(".card-jobtitle");
    profileForm["bio"].value = getText("#about .card-desc");
    profileForm["address"].value = getText("#contact .card-contact:nth-child(1)");
    profileForm["phone"].value = getText("#contact .card-contact:nth-child(2)");
    profileForm["email"].value = getText("#contact .card-contact:nth-child(3)");
    profileForm["completed_tasks"].value = getText("#experience .card-item:nth-child(1) .card-item-desc");
    profileForm["completed_skills"].value = getText("#experience .card-item:nth-child(2) .card-item-desc");
  }

  // Form submit to Flask
  function submitProfileForm() {
    const formData = new FormData(profileForm);
  
    fetch("/profile", {
      method: "POST",
      body: formData,
    })
      .then(response => response.json()) // Parse the response as JSON
      .then(data => {
        if (data.success) {  // Check if the success field is true
          if (profileModal) profileModal.style.display = 'none';
          if (saveWrapper) saveWrapper.style.display = 'none';
          showAlert(data.message, "success");  // Show success message from backend
        } else {
          showAlert(data.error || "Profile update failed.", "danger");
        }
      })
      .catch(err => {
        console.error("Error saving profile:", err);
        showAlert("Failed to save changes. Please try again.", "danger");
      });
  }
  
  // Alert utility
  function showAlert(message, type = "success") {
    const existingAlert = $(".alert");
    if (existingAlert) existingAlert.remove();

    const alertBox = document.createElement("div");
    alertBox.className = `alert alert-${type}`;
    alertBox.setAttribute("role", "alert");
    alertBox.innerHTML = `
      <span class="alert-message">${message}</span>
      <span class="alert-close" style="margin-left:auto;cursor:pointer;">&times;</span>
    `;
    document.body.appendChild(alertBox);

    alertBox.querySelector(".alert-close").addEventListener("click", () => {
      alertBox.remove();
    });

    setTimeout(() => {
      alertBox.remove();
    }, 4000);
  }

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait);
    };
  }

});

// Equal card height
function setEqualCardHeight() {
  const block1 = document.querySelector('.card.block-1');
  const block2 = document.querySelector('.card.block-2');
  if (block1 && block2) {
    block1.style.height = 'auto';
    block2.style.height = 'auto';
    const maxHeight = Math.max(block1.offsetHeight, block2.offsetHeight);
    block1.style.height = `${maxHeight}px`;
    block2.style.height = `${maxHeight}px`;
  }
}
