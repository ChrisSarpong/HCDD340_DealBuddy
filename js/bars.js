fetch("/json/bars.json")
  .then(response => response.json())
  .then(bars => {
    const selector = document.getElementById("bar-selector");
    const barImage = document.getElementById("bar-image");
    const barName = document.getElementById("bar-name");
    const barDeal = document.getElementById("bar-deal");
    const newDealSection = document.getElementById("new-deal-section");

    // Populate dropdown
    bars.forEach(bar => {
      const option = document.createElement("option");
      option.value = bar.name;
      option.textContent = bar.name;
      selector.appendChild(option);
    });

    // On dropdown change
    selector.addEventListener("change", () => {
      const selected = selector.value;
      const bar = bars.find(b => b.name === selected);

      if (bar) {
        barImage.src = "/Bar Pictures/" + bar.image;
        barImage.style.display = "block";

        barName.textContent = bar.name;
        barDeal.textContent = bar.deal;

        // Show New Deal input section
        newDealSection.style.display = "block";
      } else {
        barImage.style.display = "none";
        barName.textContent = "";
        barDeal.textContent = "";

        // Hide New Deal input section
        newDealSection.style.display = "none";
      }
    });
  });