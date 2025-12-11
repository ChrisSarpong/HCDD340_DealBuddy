document.addEventListener("DOMContentLoaded", () => {
  const avatar = document.getElementById("profileAvatar");
  const avatarImg = document.getElementById("profileAvatarImg");

  const AVATAR_STORAGE_KEY = "dealbuddy_profile_avatar";

  if (avatar && avatarImg) {
    try {
      const saved = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (saved) {
        avatarImg.src = saved;
        avatar.classList.add("has-image");
      }
    } catch (e) {
      console.warn("Could not read avatar from localStorage:", e);
    }

    avatar.addEventListener("click", () => {
      const url = "/htmlpages/camera.html"; // adjust if path is different
      window.open(
        url,
        "DealBuddyCamera",
        "width=520,height=620,menubar=no,toolbar=no,location=no,status=no"
      );
    });

    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (!msg || msg.type !== "DEALBUDDY_AVATAR_UPDATED") return;

      const dataUrl = msg.dataUrl;
      if (!dataUrl) return;

      avatarImg.src = dataUrl;
      avatar.classList.add("has-image");

      try {
        localStorage.setItem(AVATAR_STORAGE_KEY, dataUrl);
      } catch (e) {
        console.warn(
          "Could not save avatar to localStorage from profile page:",
          e
        );
      }
    });
  } else {
    console.warn("Profile avatar elements not found.");
  }


  const nameEl = document.querySelector(".profile-name");
  const usernameEl = document.querySelector(".profile-username");
  const bioEl = document.querySelector(".profile-bio");

  const editBtn = document.querySelector(".profile-actions .button");
  const logoutBtn = document.querySelector(".profile-actions .buttons");

  const modal = document.getElementById("editProfileModal");
  const nameInput = document.getElementById("editName");
  const usernameInput = document.getElementById("editUsername");
  const bioInput = document.getElementById("editBio");
  const saveBtn = document.getElementById("saveProfileBtn");
  const cancelBtn = document.getElementById("cancelProfileBtn");

  const NAME_KEY = "dealbuddy_profile_name";
  const USERNAME_KEY = "dealbuddy_profile_username";
  const BIO_KEY = "dealbuddy_profile_bio";

  function loadProfileFields() {
    if (!nameEl || !usernameEl || !bioEl) return;

    const savedName = localStorage.getItem(NAME_KEY) || "Aryan Walanj";
    const savedUsername =
      localStorage.getItem(USERNAME_KEY) || "@aryan.w";
    const savedBio =
      localStorage.getItem(BIO_KEY) ||
      "Your average deal hunter here @ State College :)";

    nameEl.textContent = savedName;
    usernameEl.textContent = savedUsername;
    bioEl.textContent = savedBio;
  }

  loadProfileFields();

  if (editBtn && modal && nameInput && usernameInput && bioInput) {
    editBtn.addEventListener("click", () => {
      nameInput.value = nameEl.textContent;
      usernameInput.value = usernameEl.textContent.replace("@", "");
      bioInput.value = bioEl.textContent;

      modal.style.display = "flex";
    });
  }

  if (cancelBtn && modal) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const newName = nameInput.value.trim() || "Aryan Walanj";
      const newUsername = usernameInput.value.trim() || "aryan.w";
      const newBio =
        bioInput.value.trim() ||
        "Your average deal hunter here @ State College :)";

      localStorage.setItem(NAME_KEY, newName);
      localStorage.setItem(USERNAME_KEY, "@" + newUsername);
      localStorage.setItem(BIO_KEY, newBio);

      loadProfileFields();
      if (modal) modal.style.display = "none";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      
      alert("You have been logged out.");
      window.location.href = "/htmlpages/homepage.html";
    });
  }
});

