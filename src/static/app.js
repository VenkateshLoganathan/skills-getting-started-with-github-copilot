document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function escapeHtml(value) {
    return value.replace(/[&<>\"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '\"': "&quot;",
        "'": "&#39;",
      };

      return entities[char];
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup = details.participants.length
          ? details.participants
              .map(
                (participant) => `
                  <li class="participant-item">
                    <span class="participant-email">${escapeHtml(participant)}</span>
                    <button
                      type="button"
                      class="participant-delete"
                      data-activity="${encodeURIComponent(name)}"
                      data-email="${encodeURIComponent(participant)}"
                      aria-label="Remove ${escapeHtml(participant)} from ${escapeHtml(name)}"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M9 3.75h6a1 1 0 0 1 1 1V6h3a.75.75 0 0 1 0 1.5h-1.1l-.72 10.18A2.25 2.25 0 0 1 14.93 20H9.07a2.25 2.25 0 0 1-2.25-2.32L6.1 7.5H5a.75.75 0 0 1 0-1.5h3V4.75a1 1 0 0 1 1-1Zm5.5 2.25v-.75h-5V6h5Zm-5.19 3.25a.75.75 0 0 0-.75.79l.35 6.5a.75.75 0 0 0 1.5-.08l-.35-6.5a.75.75 0 0 0-.75-.71Zm5.38 0a.75.75 0 0 0-.75.71l-.35 6.5a.75.75 0 1 0 1.5.08l.35-6.5a.75.75 0 0 0-.75-.79Z" />
                      </svg>
                    </button>
                  </li>`
              )
              .join("")
          : '<li class="participant-empty">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title">Participants</p>
            <ul class="participants-list">${participantsMarkup}</ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete");

    if (!deleteButton) {
      return;
    }

    const activity = decodeURIComponent(deleteButton.dataset.activity);
    const email = decodeURIComponent(deleteButton.dataset.email);

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Unable to remove participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
