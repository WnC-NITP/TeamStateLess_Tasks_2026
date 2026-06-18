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

  let dataState = {}; // The single source of truth for raw strings vs calculated totals
  let currentCellId = null;
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
    localStorage.setItem("row", rowEntered);
    localStorage.setItem("column", columnEntered);
  }

  addRowBtn.addEventListener("click", () => {
    let value = parseInt(prompt("Enter the number of rows you want to add: "));
    if (!value || isNaN(value)) return;

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
    spreadContainer.style.gridTemplateRows = `repeat(${rowEntered + 1}, 30px)`;
    localStorage.setItem("row", rowEntered);
  });

  addColumnBtn.addEventListener("click", () => {
    let value = parseInt(
      prompt("Enter the number of columns you want to add: "),
    );
    if (!value || isNaN(value)) return;

    for (let col = 1; col <= value; col++) {
      for (let i = 0; i <= rowEntered; i++) {
        let cellCreated;
        let newDataColumnIndex = columnEntered + col;
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
    localStorage.setItem("column", columnEntered);
  });

  clearBtn.addEventListener("click", () => {
    const cell = document.querySelectorAll(".cell4input");
    cell.forEach((singleInput) => {
      singleInput.value = "";
    });
    dataState = {};
    localStorage.clear();
  });

  // Auto-save setup
  const autoSave = document.getElementById("auto-save");
  let autoSaveBoolean = false;
  autoSave.addEventListener("click", (e) => {
    autoSaveBoolean = !autoSaveBoolean;
    alert(autoSaveBoolean ? "Auto save on" : "Auto save off");
  });

  function saveChange() {
    const cell = document.querySelectorAll(".cell4input");
    cell.forEach((singleInput) => {
      if (singleInput.value !== "") {
        localStorage.setItem(singleInput.id, singleInput.value);
        console.log(`Saved: ${singleInput.id} = ${singleInput.value}`);
      }
    });
    alert("Spreadsheet Saved!");
  }

  // =================================================================
  // UNIFIED FOCUS LISTENER
  // =================================================================
  spreadContainer.addEventListener("focusin", (e) => {
    if (e.target.tagName === "INPUT") {
      if (currentCellId) {
        const previousCell = document.getElementById(currentCellId);
        if (previousCell) {
          previousCell.classList.remove("selected-cell");
        }
      }

      currentCellId = e.target.id;
      console.log(`Current Selected Cell: ${currentCellId}`);
      e.target.classList.add("selected-cell");

      const cellIndicator = document.getElementById("cell-indicator");
      if (cellIndicator) cellIndicator.innerText = currentCellId;

      const formulaBar = document.getElementById("formula-bar");
      if (formulaBar) {
        formulaBar.disabled = false;
        formulaBar.value = dataState[currentCellId]
          ? dataState[currentCellId].raw
          : e.target.value;
      }
    }
  });

  // =================================================================
  // FORMULA BAR ACTIONS
  // =================================================================
  const formulaBarElement = document.getElementById("formula-bar");
  if (formulaBarElement) {
    formulaBarElement.addEventListener("input", (event) => {
      if (!currentCellId) return;

      const currentInputDom = document.getElementById(currentCellId);
      const userTyped = event.target.value;

      currentInputDom.value = userTyped;

      if (!dataState[currentCellId]) {
        dataState[currentCellId] = { raw: "", value: "", dependents: [] };
      }
      dataState[currentCellId].raw = userTyped;
    });

    formulaBarElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && currentCellId) {
        document
          .getElementById(currentCellId)
          .dispatchEvent(new Event("change", { bubbles: true }));
        formulaBarElement.blur();
      }
    });

    formulaBarElement.addEventListener("blur", () => {
      if (currentCellId) {
        document
          .getElementById(currentCellId)
          .dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  // ==========================================
  // 1. THE FORMULA PARSER ENGINE
  // ==========================================
  function evaluateFormula(rawExpression) {
    if (!rawExpression || !rawExpression.startsWith("=")) {
      return rawExpression;
    }

    try {
      let expression = rawExpression.slice(1).toUpperCase();

      // ---- RANGE FUNCTIONS (SUM, AVG, MIN, MAX) ----
      const rangeRegex = /(SUM|AVG|MIN|MAX)\(([A-Z]\d+):([A-Z]\d+)\)/;
      const rangeMatch = expression.match(rangeRegex);

      if (rangeMatch) {
        const [_, funcName, startCell, endCell] = rangeMatch;

        let startCol = startCell.match(/[A-Z]/)[0].charCodeAt(0);
        let startRow = parseInt(startCell.match(/\d+/)[0]);
        let endCol = endCell.match(/[A-Z]/)[0].charCodeAt(0);
        let endRow = parseInt(endCell.match(/\d+/)[0]);

        let valuesArray = [];

        for (let col = startCol; col <= endCol; col++) {
          for (let row = startRow; row <= endRow; row++) {
            let currentId = `${String.fromCharCode(col)}${row}`;
            let cellData = dataState[currentId];
            valuesArray.push(
              cellData && !isNaN(parseFloat(cellData.value))
                ? parseFloat(cellData.value)
                : 0,
            );
          }
        }

        if (funcName === "SUM") return valuesArray.reduce((a, b) => a + b, 0);
        if (funcName === "AVG")
          return valuesArray.reduce((a, b) => a + b, 0) / valuesArray.length;
        if (funcName === "MIN") return Math.min(...valuesArray);
        if (funcName === "MAX") return Math.max(...valuesArray);
      }

      // ---- BASIC OPERATORS (+, -, *, /) ----
      const cellRegex = /[A-Z]\d+/g;
      let resolvedExpression = expression.replace(cellRegex, (match) => {
        const targetCell = dataState[match];
        return targetCell && !isNaN(parseFloat(targetCell.value))
          ? parseFloat(targetCell.value)
          : 0;
      });

      const result = Function(`"use strict"; return (${resolvedExpression})`)();
      return isNaN(result) ? "Invalid Formula" : result;
    } catch (error) {
      return "Invalid Formula";
    }
  }

  // ==========================================
  // 2. DEPENDENCY ENGINE & UPDATER (LEVEL 2)
  // ==========================================
  function reevaluateCellAndDependents(cellId) {
    if (!dataState[cellId]) return;

    const computedResult = evaluateFormula(dataState[cellId].raw);
    dataState[cellId].value = computedResult;

    const cellDom = document.getElementById(cellId);
    if (cellDom) {
      cellDom.value = computedResult;
    }

    if (dataState[cellId].dependents) {
      dataState[cellId].dependents.forEach((depId) => {
        reevaluateCellAndDependents(depId);
      });
    }
  }

  // =================================================================
  // 3. CENTRAL UPDATE HUB (Combined Autosave & Dependency updates)
  // =================================================================
  spreadContainer.addEventListener("change", (event) => {
    if (event.target.tagName === "INPUT") {
      const id = event.target.id;
      const rawInput = event.target.value;

      if (!dataState[id]) {
        dataState[id] = { raw: "", value: "", dependents: [] };
      }
      dataState[id].raw = rawInput;

      if (autoSaveBoolean && rawInput !== "") {
        localStorage.setItem(id, rawInput);
        console.log(`Saved: ${id} = ${rawInput}`);
      }

      // DEPENDENCY TRACKING REGISTRATION
      if (rawInput.startsWith("=")) {
        const cellRegex = /[A-Z]\d+/g;
        const formulasReferenced =
          rawInput.toUpperCase().match(cellRegex) || [];

        formulasReferenced.forEach((refId) => {
          if (!dataState[refId]) {
            dataState[refId] = { raw: "", value: "", dependents: [] };
          }
          if (!dataState[refId].dependents.includes(id)) {
            dataState[refId].dependents.push(id);
          }
        });
      }

      reevaluateCellAndDependents(id);
    }
  });
});
