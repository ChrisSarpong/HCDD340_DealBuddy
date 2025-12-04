fetch("/json/bars.json")
  .then(response => response.json())
  .then(bars => {
    const selector = document.getElementById("bar-selector");
    const barImage = document.getElementById("bar-image");
    const barName = document.getElementById("bar-name");
    const barDeal = document.getElementById("bar-deal");
    const newDealSection = document.getElementById("new-deal-section");
    const newDealInput = document.getElementById("new-deal");
    const addDealBtn = document.getElementById("add-deal-btn");

    // Load saved deals from localStorage
    const savedDeals = JSON.parse(localStorage.getItem("savedDeals")) || {};

    // Populate dropdown
    bars.forEach(bar => {
      const option = document.createElement("option");
      option.value = bar.name;
      option.textContent = bar.name;
      selector.appendChild(option);
    });

    // Function to update deal display (with delete buttons on user-added deals)
    function displayDeals(bar) {
      barDeal.innerHTML = ""; // clear previous content

      // Original JSON deal first (no delete button)
      const originalDeal = document.createElement("div");
      originalDeal.textContent = bar.deal;
      barDeal.appendChild(originalDeal);

      // Add user-added deals
      if (savedDeals[bar.name]) {
        savedDeals[bar.name].forEach((dealText, index) => {
          const dealDiv = document.createElement("div");
          dealDiv.style.display = "flex";
          dealDiv.style.alignItems = "center";
          dealDiv.style.gap = "10px";
          dealDiv.style.marginTop = "5px";

          // Deal text
          const textSpan = document.createElement("span");
          textSpan.textContent = dealText;

          // Delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "✖";
          deleteBtn.style.background = "red";
          deleteBtn.style.color = "white";
          deleteBtn.style.border = "none";
          deleteBtn.style.cursor = "pointer";
          deleteBtn.style.borderRadius = "5px";
          deleteBtn.style.padding = "3px 8px";

          // When clicked → remove that specific deal
          deleteBtn.addEventListener("click", () => {
            savedDeals[bar.name].splice(index, 1);

            // If empty, remove array
            if (savedDeals[bar.name].length === 0) {
              delete savedDeals[bar.name];
            }

            localStorage.setItem("savedDeals", JSON.stringify(savedDeals));

            displayDeals(bar); // refresh UI
          });

          dealDiv.appendChild(textSpan);
          dealDiv.appendChild(deleteBtn);

          barDeal.appendChild(dealDiv);
        });
      }
    }

    // On dropdown change
    selector.addEventListener("change", () => {
      const selected = selector.value;
      const bar = bars.find(b => b.name === selected);

      if (bar) {
        barImage.src = "/Bar Pictures/" + bar.image;
        barImage.style.display = "block";

        barName.textContent = bar.name;

        displayDeals(bar);

        newDealSection.style.display = "block";
      } else {
        barImage.style.display = "none";
        barName.textContent = "";
        barDeal.textContent = "";
        newDealSection.style.display = "none";
      }
    });

    // Add new deal button functionality
    addDealBtn.addEventListener("click", () => {
      const selected = selector.value;
      const bar = bars.find(b => b.name === selected);
      const newDeal = newDealInput.value.trim();

      if (!bar || newDeal === "") return;

      if (!savedDeals[bar.name]) {
        savedDeals[bar.name] = [];
      }

      savedDeals[bar.name].push(newDeal);

      localStorage.setItem("savedDeals", JSON.stringify(savedDeals));

      displayDeals(bar); // update UI

      newDealInput.value = ""; // clear input
    });
  });