document.addEventListener("DOMContentLoaded", () => {
  const div = document.getElementById("enterRCBox");
  const spreadContainer = document.getElementById("spreadContainer");

  const submitBtn = document.getElementById("submit-btn");
  const saveBtn = document.getElementById("save-change");
  const addRowBtn = document.getElementById("add-row-btn");
  const addColumnBtn = document.getElementById("add-column-btn");
  const clearBtn = document.getElementById("clear-btn");
  const container = document.getElementById("container");

  container.style.display = "none";

  submitBtn.addEventListener("click", hideDiv);
  saveBtn.addEventListener("click", saveChange);

  let rowEntered;
  let columnEntered;

  function hideDiv() {
    container.style.display = "block";

    rowEntered = parseInt(document.getElementById("rTo").value);
    columnEntered = parseInt(document.getElementById("cTo").value);
    div.style.display = "none";
    spreadContainer.style.gridTemplateColumns = `repeat(${columnEntered + 1},30px)`;
    spreadContainer.style.gridTemplateRows = `repeat(${rowEntered + 1},30px)`;
    for (let r = 0; r <= rowEntered; r++) {
      for (let c = 0; c <= columnEntered; c++) {
        let cellCreated;

        if (r == 0 || c == 0) {
          cellCreated = document.createElement("div");
          cellCreated.style.border = "1px solid #ccc";
          if (r == 0 && c == 0) {
            cellCreated.classList.add("none");
          } else if (r == 0) {
            cellCreated.innerHTML = String.fromCharCode(64 + c);
            cellCreated.classList.add("none");
          } else if (c == 0) {
            cellCreated.innerHTML = r;
            cellCreated.classList.add("none");
          }
        } else {
          cellCreated = document.createElement("input");
          cellCreated.classList.add("cell4input");
          cellCreated.id = `${String.fromCharCode(64 + c)}${r}`;
        }
        cellCreated.classList.add("cell");
        spreadContainer.appendChild(cellCreated);
      }
    }
  }

  addRowBtn.addEventListener("click", () => {
    let value = parseInt(prompt("Enter the number of rows you want to add: "));
    console.log(value);
    for (let count = 1; count <= value; count++) {
      for (let innerLoop = 0; innerLoop <= columnEntered; innerLoop++) {
        let cellCreated;
        if (innerLoop == 0) {
          cellCreated = document.createElement("div");
          cellCreated.style.border = "1px solid #ccc";
          cellCreated.classList.add("none");
          cellCreated.innerHTML = `${rowEntered + count}`;
        } else {
          cellCreated = document.createElement("input");
          cellCreated.classList.add("cell4input");
          cellCreated.id = `${String.fromCharCode(64 + innerLoop)}${rowEntered + count}`;
        }
        cellCreated.classList.add("cell");
        spreadContainer.appendChild(cellCreated);
      }
    }
    rowEntered += value;
  });

  // Logic of this addColumnBtn part of code is done by ai
  addColumnBtn.addEventListener("click", () => {
    let value = parseInt(
      prompt("Enter the number of columns you want to add: "),
    );
    console.log(value);

    for (let col = 1; col <= value; col++) {
      for (let i = 0; i <= rowEntered; i++) {
        let cellCreated;

        // 1. Data Width: Used to generate the letters (A, B, C)
        let newDataColumnIndex = columnEntered + col;

        // 2. Physical Grid Width: We MUST add +1 to account for the number header column!
        let currentGridWidth = newDataColumnIndex + 1;

        if (i == 0) {
          cellCreated = document.createElement("div");
          cellCreated.style.border = "1px solid #ccc";
          cellCreated.innerHTML = String.fromCharCode(64 + columnEntered + col);
          cellCreated.classList.add("none");
        } else {
          cellCreated = document.createElement("input");
          cellCreated.classList.add("cell4input");
          cellCreated.id = `${String.fromCharCode(64 + columnEntered + col)}${i}`;
        }
        cellCreated.classList.add("cell");

        let allCells = spreadContainer.children;

        // FIX: Use the Physical Grid Width for the math!
        let insertIndex = i * currentGridWidth + currentGridWidth - 1;

        if (insertIndex >= allCells.length) {
          spreadContainer.appendChild(cellCreated);
        } else {
          spreadContainer.insertBefore(cellCreated, allCells[insertIndex]);
        }
      }
    }

    columnEntered += value;
    spreadContainer.style.gridTemplateColumns = `repeat(${columnEntered + 1}, 30px)`;
  });

  clearBtn.addEventListener("click", () => {
    const cell = document.querySelectorAll(".cell4input");
    cell.forEach((singleInput) => {
      localStorage.removeItem(singleInput.id);
      singleInput.value = "";
    });
  });

  // Auto-save
  const autoSave = document.getElementById("auto-save");
  let autoSaveBoolean = false;
  autoSave.addEventListener("click", (e) => {
    autoSaveBoolean = !autoSaveBoolean;
    alert(autoSaveBoolean ? "Auto save on" : "Auto save off");
  });

  spreadContainer.addEventListener("change", (e) => {
    if (autoSaveBoolean) {
      if (e.target.classList.contains("cell4input")) {
        if (e.target.value !== "") {
          localStorage.setItem(e.target.id, e.target.value);
          console.log(`Saved: ${e.target.id} = ${e.target.value}`);
        }
      }
    }
  });

  function saveChange() {
    const cell = document.querySelectorAll(".cell4input");
    cell.forEach((singleInput) => {
      if (singleInput.value !== "") {
        localStorage.setItem(singleInput.id, singleInput.value);
        console.log(`Saved: ${singleInput.id} = ${singleInput.value}`);
      }
    });
  }
});
