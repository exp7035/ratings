document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("passcode-overlay");
  const dialPad = document.getElementById("dial-pad");
  const display = document.getElementById("passcode-display");

  const correctPasscode = "829754";
  let enteredPasscode = "";

  function updateDisplay() {
    display.textContent = "●".repeat(enteredPasscode.length) + "_".repeat(6 - enteredPasscode.length);
  }

  function validatePasscode() {
    if (enteredPasscode === correctPasscode) {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.style.display = "none";
        document.body.style.overflow = "auto"; // Restore scrolling and interaction
      }, 500);
    } else {
      enteredPasscode = "";
      updateDisplay();
      display.classList.add("shake");
      setTimeout(() => display.classList.remove("shake"), 500);
    }
  }

  dialPad.addEventListener("click", (event) => {
    const button = event.target;
    if (button.classList.contains("digit")) {
      if (enteredPasscode.length < 6) {
        enteredPasscode += button.textContent;
        updateDisplay();
        if (enteredPasscode.length === 6) {
          validatePasscode();
        }
      }
    } else if (button.id === "clear-btn") {
      enteredPasscode = "";
      updateDisplay();
    }
  });

  // Initialize display
  updateDisplay();

  // Prevent interaction with the site until passcode is entered
  document.body.style.overflow = "hidden";
});
