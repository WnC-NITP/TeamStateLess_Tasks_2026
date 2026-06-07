
let sheetData = {}; 
let activeCellId = null;


let maxRows = 6;
let maxCols = 4;
let themeMode = "light";


let undoHistory = [];
let redoHistory = [];


const headerRow = document.getElementById("header-row");
const sheetBody = document.getElementById("sheet-body");
const formulaBar = document.getElementById("formula-bar");
const currentCellDisplay = document.getElementById("current-cell-id");


function initSpreadsheet() {
    loadSheetFromStorage();
    buildGridUI();
    setupGlobalEvents();
}

function getColLabel(index) {
    let label = "";
    while (index >= 0) {
        label = String.fromCharCode((index % 26) + 65) + label;
        index = Math.floor(index / 26) - 1;
    }
    return label;
}

function getColIndex(label) {
    let index = 0;
    for (let i = 0; i < label.length; i++) {
        index = index * 26 + (label.charCodeAt(i) - 64);
    }
    return index - 1;
}

function buildGridUI() {
    headerRow.innerHTML = "<th></th>";
    for (let c = 0; c < maxCols; c++) {
        let th = document.createElement("th");
        th.textContent = getColLabel(c);
        headerRow.appendChild(th);
    }

    sheetBody.innerHTML = "";
    for (let r = 1; r <= maxRows; r++) {
        let tr = document.createElement("tr");

        let thRow = document.createElement("th");
        thRow.textContent = r;
        tr.appendChild(thRow);

        for (let c = 0; c < maxCols; c++) {
            let colName = getColLabel(c);
            let cellId = `${colName}${r}`;

            let td = document.createElement("td");
            td.setAttribute("id", "box-" + cellId);

            let input = document.createElement("input");
            input.type = "text";
            input.className = "cell-input";
            input.dataset.id = cellId;

            if (sheetData[cellId]) {
                input.value = sheetData[cellId].val;
            }

            td.appendChild(input);
            tr.appendChild(td);
        }
        sheetBody.appendChild(tr);
    }

    evaluateFormulaEngine();
    attachCellEventListeners();
}

function evaluateFormulaEngine() {
    let totalPasses = 4; 

    for (let pass = 0; pass < totalPasses; pass++) {
        for (let id in sheetData) {
            let cell = sheetData[id];
            if (!cell.raw || !cell.raw.startsWith("=")) {
                cell.val = cell.raw;
                continue; 
            }

            let formula = cell.raw.substring(1).trim();

            if (formula.toUpperCase().startsWith("SUM(") || 
                formula.toUpperCase().startsWith("AVG(") || 
                formula.toUpperCase().startsWith("MIN(") || 
                formula.toUpperCase().startsWith("MAX(")) {
                cell.val = computeRangeFunction(formula);
            } else {
                cell.val = computeBasicMathFunction(formula);
            }
        }
    }

    document.querySelectorAll(".cell-input").forEach(input => {
        let id = input.dataset.id;
        if (sheetData[id]) {
            input.value = sheetData[id].val;
        } else {
            input.value = "";
        }
    });
}

function computeRangeFunction(formulaText) {
    try {
        let openBrace = formulaText.indexOf("(");
        let closeBrace = formulaText.lastIndexOf(")");
        if(openBrace === -1 || closeBrace === -1) return "Invalid Formula";

        let operation = formulaText.substring(0, openBrace).toUpperCase();
        let argumentsStr = formulaText.substring(openBrace + 1, closeBrace);
        let parameters = argumentsStr.split(",");

        let numericList = [];

        for (let param of parameters) {
            param = param.trim();
            if (param === "") continue;

            if (param.includes(":")) {
                let rangeParts = param.split(":");
                if (rangeParts.length !== 2) return "Invalid Formula";

                let startMatch = rangeParts[0].trim().match(/^([A-Z]+)(\d+)$/);
                let endMatch = rangeParts[1].trim().match(/^([A-Z]+)(\d+)$/);
                if (!startMatch || !endMatch) return "Invalid Formula";

                let startCol = getColIndex(startMatch[1]);
                let startRow = parseInt(startMatch[2]);
                let endCol = getColIndex(endMatch[1]);
                let endRow = parseInt(endMatch[2]);

                for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
                    for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
                        let checkId = `${getColLabel(c)}${r}`;
                        let cellObj = sheetData[checkId];
                        if (cellObj && cellObj.val !== "") {
                            let num = parseFloat(cellObj.val);
                            if (!isNaN(num)) numericList.push(num);
                        }
                    }
                }
            } 
            else if (param.match(/^([A-Z]+)(\d+)$/)) {
                let cellObj = sheetData[param];
                if (cellObj && cellObj.val !== "") {
                    let num = parseFloat(cellObj.val);
                    if (!isNaN(num)) numericList.push(num);
                }
            } 
            else {
                let num = parseFloat(param);
                if (!isNaN(num)) {
                    numericList.push(num);
                } else {
                    return "Invalid Formula";
                }
            }
        }

        if (numericList.length === 0) return 0;

        if (operation === "SUM") return numericList.reduce((total, n) => total + n, 0);
        if (operation === "AVG") return numericList.reduce((total, n) => total + n, 0) / numericList.length;
        if (operation === "MIN") return Math.min(...numericList);
        if (operation === "MAX") return Math.max(...numericList);
        
        return "Invalid Formula";
    } catch (err) {
        return "Invalid Formula";
    }
}

function computeBasicMathFunction(formulaText) {
    let processedExpression = formulaText.toUpperCase().replace(/([A-Z]+\d+)/g, function(match) {
        let cellObj = sheetData[match];
        if (cellObj && cellObj.val !== "") {
            let num = parseFloat(cellObj.val);
            if (cellObj.val === "Invalid Formula" || cellObj.val === "Cyclic Error") return "NaN";
            return isNaN(num) ? 0 : num;
        }
        return 0;
    });

    let approvedTokens = /^[0-9.+\-*/() ]+$/;
    if (!approvedTokens.test(processedExpression)) {
        return "Invalid Formula";
    }

    try {
        let outcome = Function(`"use strict"; return (${processedExpression})`)();
        if (isNaN(outcome) || !isFinite(outcome)) return "Invalid Formula";
        return outcome;
    } catch (e) {
        return "Invalid Formula";
    }
}

// --- 4. History Management ---
function registerHistoryState() {
    undoHistory.push(JSON.stringify(sheetData));
    redoHistory = []; 
}

function processCellWrite(id, rawTextValue) {
    registerHistoryState();
    if (!sheetData[id]) sheetData[id] = { raw: "", val: "" };
    sheetData[id].raw = rawTextValue;
    evaluateFormulaEngine();
    autoSaveSheetToStorage();
}

function attachCellEventListeners() {
    document.querySelectorAll(".cell-input").forEach(input => {
        input.addEventListener("focus", function() {
            activeCellId = input.dataset.id;
            currentCellDisplay.textContent = activeCellId;
            formulaBar.disabled = false;

            document.querySelectorAll("td").forEach(td => td.classList.remove("cell-focus"));
            let parentTd = document.getElementById("box-" + activeCellId);
            if (parentTd) parentTd.classList.add("cell-focus");

            let cellObj = sheetData[activeCellId];
            formulaBar.value = cellObj ? cellObj.raw : "";
        });

        input.addEventListener("change", function() {
            processCellWrite(input.dataset.id, input.value);
        });
    });
}

function setupGlobalEvents() {
    formulaBar.addEventListener("input", function() {
        if (!activeCellId) return;
        let activeInput = document.querySelector(`.cell-input[data-id="${activeCellId}"]`);
        if (activeInput) activeInput.value = formulaBar.value; 
    });

    formulaBar.addEventListener("change", function() {
        if (!activeCellId) return;
        processCellWrite(activeCellId, formulaBar.value);
    });

    document.addEventListener("keydown", function(e) {
        if (!activeCellId) return;
        
        let match = activeCellId.match(/^([A-Z]+)(\d+)$/);
        let col = getColIndex(match[1]);
        let row = parseInt(match[2]);

        if (e.key === "ArrowUp") row--;
        else if (e.key === "ArrowDown") row++;
        else if (e.key === "ArrowLeft") col--;
        else if (e.key === "ArrowRight") col++;
        else return;

        if (row < 1 || row > maxRows || col < 0 || col >= maxCols) return;

        e.preventDefault();
        let targetId = `${getColLabel(col)}${row}`;
        let targetInput = document.querySelector(`.cell-input[data-id="${targetId}"]`);
        if (targetInput) targetInput.focus();
    });

    document.getElementById("btn-row").addEventListener("click", function() {
        registerHistoryState();
        maxRows = maxRows + 1; 
        buildGridUI();
        autoSaveSheetToStorage();
    });

    document.getElementById("btn-col").addEventListener("click", function() {
        registerHistoryState();
        maxCols = maxCols + 1; 
        buildGridUI();
        autoSaveSheetToStorage();
    });

    document.getElementById("btn-theme").addEventListener("click", function() {
        if (themeMode === "light") {
            document.body.classList.add("dark-theme");
            themeMode = "dark";
        } else {
            document.body.classList.remove("dark-theme");
            themeMode = "light";
        }
        autoSaveSheetToStorage();
    });

    document.getElementById("btn-undo").addEventListener("click", triggerUndoOperation);
    document.getElementById("btn-redo").addEventListener("click", triggerRedoOperation);

    document.getElementById("btn-clear").addEventListener("click", function() {
        if (confirm("Do you really want to clear your entire sheet?")) {
            registerHistoryState();
            sheetData = {};
            formulaBar.value = "";
            currentCellDisplay.textContent = "None";
            formulaBar.disabled = true;
            evaluateFormulaEngine();
            autoSaveSheetToStorage();
        }
    });
}

function triggerUndoOperation() {
    if (undoHistory.length === 0) return;
    redoHistory.push(JSON.stringify(sheetData));
    sheetData = JSON.parse(undoHistory.pop());
    refreshUIState();
}

function triggerRedoOperation() {
    if (redoHistory.length === 0) return;
    undoHistory.push(JSON.stringify(sheetData));
    sheetData = JSON.parse(redoHistory.pop());
    refreshUIState();
}

function refreshUIState() {
    evaluateFormulaEngine();
    if (activeCellId) {
        let cellObj = sheetData[activeCellId];
        formulaBar.value = cellObj ? cellObj.raw : "";
    }
}

function autoSaveSheetToStorage() {
    let currentLayoutState = { maxRows, maxCols, sheetData, themeMode };
    localStorage.setItem("creative_sheet_save", JSON.stringify(currentLayoutState));
}

function loadSheetFromStorage() {
    let savedRawData = localStorage.getItem("creative_sheet_save");
    if (!savedRawData) return;
    try {
        let configObj = JSON.parse(savedRawData);
        maxRows = configObj.maxRows || 6;
        maxCols = configObj.maxCols || 4;
        sheetData = configObj.sheetData || {};
        themeMode = configObj.themeMode || "light";
        
        if (themeMode === "dark") {
            document.body.classList.add("dark-theme");
        }
    } catch (err) {
        console.log("Error loading save file configuration", err);
    }
}

initSpreadsheet();