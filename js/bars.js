fetch("/json/bars.json")
  .then(response => response.json())
  .then(bars => {
    const selector = document.getElementById("bar-selector");
    const barImage = document.getElementById("bar-image");
    const barName = document.getElementById("bar-name");
    const barDeal = document.getElementById("bar-deal");

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
        // FIXED: correct image directory
        barImage.src = "/Bar Pictures/" + bar.image;
        barImage.style.display = "block";

        barName.textContent = bar.name;
        barDeal.textContent = bar.deal;
      } else {
        // Reset fields
        barImage.style.display = "none";
        barName.textContent = "";
        barDeal.textContent = "";
      }
    });
  });