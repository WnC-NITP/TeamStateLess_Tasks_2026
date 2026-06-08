// --- Global Application State ---
let totalRows = 12;
let totalCols = 8;

let sheetData = {}; 
let selectedCellId = null;

// Clean state-tracking history arrays
let undoHistory = [];
let redoHistory = [];

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    loadSavedData();
    buildGrid();
    bindEvents();
    createSearchField();
    updateUndoRedoButtons();
}

// --- Search Implementation ---
function createSearchField() {
    const toolbar = document.querySelector('.toolbar');
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-left: auto; display: flex; align-items: center; gap: 6px;';
    
    wrapper.innerHTML = `
        <label style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary)">Search:</label>
        <input type="text" id="search-field" placeholder="Type to find..." style="padding: 5px 8px; border: 1px solid var(--border-main); border-radius: 4px; outline: none; font-size: 0.85rem;">
    `;
    toolbar.appendChild(wrapper);
    
    document.getElementById('search-field').addEventListener('input', runSearch);
}

function runSearch(e) {
    const term = e.target.value.toLowerCase().trim();
    document.querySelectorAll(".cell.data-cell").forEach(cell => {
        if (term && cell.innerText.toLowerCase().includes(term)) {
            cell.classList.add("match-found");
        } else {
            cell.classList.remove("match-found");
        }
    });
}

// --- Layout Matrix Generation ---
function buildGrid() {
    const container = document.getElementById("grid-container");
    container.innerHTML = "";

    // Build the grid column tracks
    container.style.gridTemplateColumns = `40px repeat(${totalCols}, minmax(100px, 1fr))`;

    // Top-left dead corner
    const corner = document.createElement("div");
    corner.className = "cell header corner";
    container.appendChild(corner);

    // Alpha headers (A, B, C...)
    for (let c = 0; c < totalCols; c++) {
        const header = document.createElement("div");
        header.className = "cell header top";
        header.innerText = getColName(c);
        container.appendChild(header);
    }

    // Build functional table rows
    for (let r = 1; r <= totalRows; r++) {
        const rowHeader = document.createElement("div");
        rowHeader.className = "cell header left";
        rowHeader.innerText = r;
        container.appendChild(rowHeader);

        for (let c = 0; c < totalCols; c++) {
            const colLetter = getColName(c);
            const cellId = `${colLetter}${r}`;
            
            const cell = document.createElement("div");
            cell.className = "cell data-cell";
            cell.dataset.id = cellId;
            cell.contentEditable = true;

            if (sheetData[cellId]) {
                cell.innerText = sheetData[cellId].value;
            }

            container.appendChild(cell);
        }
    }
}

// Helper coordinate translation: 0 -> A, 26 -> AA
function getColName(index) {
    let name = "";
    while (index >= 0) {
        name = String.fromCharCode((index % 26) + 65) + name;
        index = Math.floor(index / 26) - 1;
    }
    return name;
}

function getColIndex(label) {
    let index = 0;
    for (let i = 0; i < label.length; i++) {
        index = index * 26 + (label.charCodeAt(i) - 64);
    }
    return index - 1;
}

// --- Form & Interaction Logic ---
function bindEvents() {
    const container = document.getElementById("grid-container");
    const formulaInput = document.getElementById("formula-input");

    // Delegate cell focus events
    container.addEventListener("focusin", (e) => {
        if (!e.target.classList.contains("data-cell")) return;
        
        selectedCellId = e.target.dataset.id;
        const cellInfo = sheetData[selectedCellId] || { value: "", formula: "" };
        
        formulaInput.value = cellInfo.formula ? cellInfo.formula : cellInfo.value;
    });

    container.addEventListener("focusout", (e) => {
        if (!e.target.classList.contains("data-cell")) return;
        saveCellChange(e.target);
    });

    // Process inputs on formula line
    formulaInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && selectedCellId) {
            e.preventDefault();
            const activeCell = document.querySelector(`[data-id="${selectedCellId}"]`);
            if (activeCell) {
                pushSnapshot();
                writeCellState(selectedCellId, formulaInput.value);
                activeCell.focus();
            }
        }
    });

    // Action Control Button Handlers
    document.getElementById("btn-undo").addEventListener("click", triggerUndo);
    document.getElementById("btn-redo").addEventListener("click", triggerRedo);
    
    document.getElementById("btn-add-row").addEventListener("click", () => { 
        pushSnapshot(); 
        totalRows++; 
        buildGrid(); 
        autoSaveToStorage(); 
    });
    
    document.getElementById("btn-add-col").addEventListener("click", () => { 
        pushSnapshot(); 
        totalCols++; 
        buildGrid(); 
        autoSaveToStorage(); 
    });
    
    document.getElementById("btn-save").addEventListener("click", () => { 
        manualSave(); 
        alert("Changes saved cleanly!"); 
    });
    
    document.getElementById("btn-clear").addEventListener("click", wipeSheetData);

    window.addEventListener("keydown", handleKeyNavigation);
}

function saveCellChange(cellElement) {
    const cellId = cellElement.dataset.id;
    const rawInput = cellElement.innerText.trim();
    const current = sheetData[cellId] || { value: "", formula: "" };

    // Break unnecessary loop triggers if content didn't change
    if (current.formula === rawInput || (!current.formula && current.value === rawInput)) {
        cellElement.innerText = current.value;
        return;
    }

    pushSnapshot();
    writeCellState(cellId, rawInput);
    autoSaveToStorage();
}

function writeCellState(cellId, textInput) {
    if (!sheetData[cellId]) {
        sheetData[cellId] = { value: "", formula: "" };
    }

    if (textInput.startsWith("=")) {
        sheetData[cellId].formula = textInput;
    } else {
        sheetData[cellId].formula = "";
        sheetData[cellId].value = textInput;
    }

    runCalculations();
    updateUIElements();
}

// --- Computation Engine ---
function runCalculations() {
    let resolvedCache = {};

    for (let cellId in sheetData) {
        if (sheetData[cellId].formula) {
            computeCell(cellId, resolvedCache, new Set());
        }
    }
}

function computeCell(cellId, cache, cycleTracker) {
    if (cycleTracker.has(cellId)) {
        sheetData[cellId].value = "#REF!";
        return "#REF!";
    }
    if (cache[cellId] !== undefined) return cache[cellId];

    cycleTracker.add(cellId);
    const formula = sheetData[cellId].formula;

    try {
        let evaluatedOutput = parseFormulaText(formula, cache, cycleTracker);
        sheetData[cellId].value = evaluatedOutput;
        cache[cellId] = evaluatedOutput;
    } catch (err) {
        sheetData[cellId].value = "#ERR!";
        cache[cellId] = "#ERR!";
    }

    cycleTracker.delete(cellId);
    return cache[cellId];
}

function parseFormulaText(formulaStr, cache, cycleTracker) {
    let cleanExpr = formulaStr.substring(1).toUpperCase().trim();

    // 1. Math Range Functions
    const functionRegex = /(SUM|AVG|MIN|MAX)\(([A-Z]+\d+):([A-Z]+\d+)\)/;
    const match = cleanExpr.match(functionRegex);

    if (match) {
        const funcName = match[1];
        const rangeList = resolveCellRange(match[2], match[3]);
        
        let numbers = rangeList.map(id => {
            let val = getCellLiveVal(id, cache, cycleTracker);
            return parseFloat(val);
        }).filter(val => !isNaN(val));

        if (numbers.length === 0 && rangeList.length > 0) return 0;

        switch (funcName) {
            case "SUM": return numbers.reduce((total, n) => total + n, 0);
            case "AVG": return numbers.reduce((total, n) => total + n, 0) / numbers.length;
            case "MIN": return Math.min(...numbers);
            case "MAX": return Math.max(...numbers);
        }
    }

    // 2. Direct Cell Token Parsing
    let structuralTokens = cleanExpr.split(/([\+\-\*\/])/);
    let inlineMathExpression = structuralTokens.map(token => {
        token = token.trim();
        if (/^[A-Z]+\d+$/.test(token)) {
            let value = getCellLiveVal(token, cache, cycleTracker);
            let parsedNum = parseFloat(value);
            return isNaN(parsedNum) ? 0 : parsedNum;
        }
        return token;
    }).join("");

    if (/^[0-9\+\-\*\/\.\s\(\)]+$/.test(inlineMathExpression)) {
        let finalCalculation = Function(`"use strict"; return (${inlineMathExpression})`)();
        return finalCalculation === Infinity || isNaN(finalCalculation) ? "#DIV/0!" : finalCalculation;
    }

    return "#VALUE!";
}

function getCellLiveVal(cellId, cache, cycleTracker) {
    if (!sheetData[cellId]) return 0;
    if (sheetData[cellId].formula) {
        return computeCell(cellId, cache, cycleTracker);
    }
    return sheetData[cellId].value;
}

function resolveCellRange(startCell, endCell) {
    const startCol = startCell.match(/[A-Z]+/)[0];
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const endCol = endCell.match(/[A-Z]+/)[0];
    const endRow = parseInt(endCell.match(/\d+/)[0]);

    const sColIdx = getColIndex(startCol);
    const eColIdx = getColIndex(endCol);

    const minC = Math.min(sColIdx, eColIdx);
    const maxC = Math.max(sColIdx, eColIdx);
    const minR = Math.min(startRow, endRow);
    const maxR = Math.max(startRow, endRow);

    let cellIDs = [];
    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            cellIDs.push(`${getColName(c)}${r}`);
        }
    }
    return cellIDs;
}

function updateUIElements() {
    document.querySelectorAll(".cell.data-cell").forEach(cell => {
        const id = cell.dataset.id;
        cell.innerText = sheetData[id] ? sheetData[id].value : "";
    });
}

// --- Keyboard Focus Navigation ---
function handleKeyNavigation(e) {
    if (!selectedCellId || !document.activeElement.classList.contains("data-cell")) return;

    let currentCell = document.activeElement;
    let colPart = currentCell.dataset.id.match(/[A-Z]+/)[0];
    let rowPart = parseInt(currentCell.dataset.id.match(/\d+/)[0]);
    let currentColumnIndex = getColIndex(colPart);

    let nextTargetId = null;

    // Check system shortcut configurations
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        triggerUndo();
        return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        triggerRedo();
        return;
    }

    switch (e.key) {
        case "ArrowUp":
            if (rowPart > 1) nextTargetId = `${colPart}${rowPart - 1}`;
            break;
        case "ArrowDown":
            if (rowPart < totalRows) nextTargetId = `${colPart}${rowPart + 1}`;
            break;
        case "ArrowLeft":
            if (currentColumnIndex > 0) nextTargetId = `${getColName(currentColumnIndex - 1)}${rowPart}`;
            break;
        case "ArrowRight":
            if (currentColumnIndex < totalCols - 1) nextTargetId = `${getColName(currentColumnIndex + 1)}${rowPart}`;
            break;
        case "Enter":
            e.preventDefault(); 
            if (rowPart < totalRows) nextTargetId = `${colPart}${rowPart + 1}`;
            break;
        default:
            return;
    }

    if (nextTargetId) {
        const targetElement = document.querySelector(`[data-id="${nextTargetId}"]`);
        if (targetElement) targetElement.focus();
    }
}

// --- State History Tracking (Undo / Redo) ---
function pushSnapshot() {
    undoHistory.push(JSON.stringify({
        data: sheetData,
        rows: totalRows,
        cols: totalCols
    }));
    redoHistory = []; // Breaking structural continuity on newer actions
    updateUndoRedoButtons();
}

function triggerUndo() {
    if (undoHistory.length === 0) return;
    
    redoHistory.push(JSON.stringify({
        data: sheetData,
        rows: totalRows,
        cols: totalCols
    }));
    
    let previousState = JSON.parse(undoHistory.pop());
    restoreState(previousState);
}

function triggerRedo() {
    if (redoHistory.length === 0) return;
    
    undoHistory.push(JSON.stringify({
        data: sheetData,
        rows: totalRows,
        cols: totalCols
    }));
    
    let subsequentState = JSON.parse(redoHistory.pop());
    restoreState(subsequentState);
}

function restoreState(stateObj) {
    sheetData = stateObj.data;
    totalRows = stateObj.rows;
    totalCols = stateObj.cols;
    
    buildGrid();
    updateUndoRedoButtons();
    autoSaveToStorage();
}

function updateUndoRedoButtons() {
    document.getElementById("btn-undo").disabled = (undoHistory.length === 0);
    document.getElementById("btn-redo").disabled = (redoHistory.length === 0);
}

// --- Storage Controls ---
function manualSave() {
    localStorage.setItem("user_sheet_data", JSON.stringify(sheetData));
    localStorage.setItem("user_sheet_dimensions", JSON.stringify({ rows: totalRows, cols: totalCols }));
}

function autoSaveToStorage() {
    manualSave();
}

function loadSavedData() {
    const dataString = localStorage.getItem("user_sheet_data");
    const dimensionalString = localStorage.getItem("user_sheet_dimensions");
    
    if (dataString) sheetData = JSON.parse(dataString);
    if (dimensionalString) {
        const coords = JSON.parse(dimensionalString);
        totalRows = coords.rows;
        totalCols = coords.cols;
    }
}

function wipeSheetData() {
    if (confirm("Clear all data? This action can be undone via Ctrl+Z.")) {
        pushSnapshot();
        sheetData = {};
        document.getElementById("formula-input").value = "";
        runCalculations();
        updateUIElements();
        autoSaveToStorage();
    }
}