
let state = {
    rows: 10,
    cols: 5,
    cells: {} 
};

const table = document.getElementById("spreadsheet");
const formulaBar = document.getElementById("formulaBar");
let selectedCell = null;

// LEVEL 1: Create Spreadsheet Grid dynamically
function createTable() {
    table.innerHTML = "";

    for (let r = 0; r <= state.rows; r++) {
        const row = document.createElement("tr");

        for (let c = 0; c <= state.cols; c++) {
            let cell;

            // Handle headers
            if (r === 0 || c === 0) {
                cell = document.createElement("th");
                if (r === 0 && c > 0) cell.textContent = String.fromCharCode(64 + c);
                if (c === 0 && r > 0) cell.textContent = r;
            } else {
        
                const colLetter = String.fromCharCode(64 + c);
                const cellId = `${colLetter}${r}`;

                cell = document.createElement("td");
                cell.contentEditable = true;
                cell.id = cellId;

                // Select Cell 
                cell.addEventListener("click", () => {
                    selectedCell = cell;
                    document.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
                    cell.classList.add("selected");
                    
                    const cellData = state.cells[cellId];
                    formulaBar.value = cellData ? cellData.rawValue : cell.textContent;
                });

                // Update cell values when clicking away
                cell.addEventListener("blur", () => {
                    updateCell(cellId, cell.textContent);
                });

                cell.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        updateCell(cellId, cell.textContent);
                        cell.blur();
                    }
                });
            }
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

// LEVEL 1 & 2: Upgraded Formula Evaluation Engine
function evaluateFormula(formula, currentId) {
    try {
        let expression = formula.substring(1).toUpperCase(); 

        expression = expression.replace(/(SUM|AVG|MIN|MAX)\(([A-Z]+\d+):([A-Z]+\d+)\)/g, function(match, func, start, end) {
            const rangeCells = getCellRange(start, end);
            const values = rangeCells.map(id => {
                const c = state.cells[id];
                return c ? Number(c.computedValue) || 0 : 0;
            });

            if (func === 'SUM') return `(${values.join('+')})`;
            if (func === 'AVG') return `((${values.join('+')})/${values.length})`;
            if (func === 'MIN') return `Math.min(${values.join(',')})`;
            if (func === 'MAX') return `Math.max(${values.join(',')})`;
            return 0;
        });

        expression = expression.replace(/[A-Z]+\d+/g, function(match) {
            if (match === currentId) return 0; // Avoid infinite recursive loops crashing browser
            const targetCell = state.cells[match];
            return targetCell ? Number(targetCell.computedValue) || 0 : 0;
        });

        // 3. Compute JavaScript Execution safely
        const result = new Function(`return ${expression}`)();
        return isNaN(result) || !isFinite(result) ? "Invalid Formula" : result;
    } catch (err) {
        return "Invalid Formula";
    }
}

function getCellRange(start, end) {
    const startCol = start.match(/[A-Z]+/)[0];
    const startRow = parseInt(start.match(/\d+/)[0]);
    const endCol = end.match(/[A-Z]+/)[0];
    const endRow = parseInt(end.match(/\d+/)[0]);

    const cellList = [];
    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
            cellList.push(`${String.fromCharCode(c)}${r}`);
        }
    }
    return cellList;
}

function updateCell(cellId, value) {
    if (!state.cells[cellId]) {
        state.cells[cellId] = { rawValue: "", computedValue: "" };
    }

    state.cells[cellId].rawValue = value;

    if (value.startsWith("=")) {
        state.cells[cellId].computedValue = evaluateFormula(value, cellId);
    } else {
        state.cells[cellId].computedValue = value;
    }

    const element = document.getElementById(cellId);
    if (element) {
        element.textContent = state.cells[cellId].computedValue;
    }

    // LEVel-2
    Object.keys(state.cells).forEach(id => {
        const otherCell = state.cells[id];
        if (otherCell.rawValue.startsWith("=") && id !== cellId) {
            if (otherCell.rawValue.toUpperCase().includes(cellId)) {
                // If cell uses our modified ID, force it to re-evaluate dynamically
                updateCell(id, otherCell.rawValue);
            }
        }
    });

    saveData();
}

formulaBar.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && selectedCell) {
        e.preventDefault();
        updateCell(selectedCell.id, formulaBar.value);
        formulaBar.blur();
    }
});

document.getElementById("addRow").addEventListener("click", () => {
    state.rows++;
    createTable();
    renderStateValues();
});

document.getElementById("addCol").addEventListener("click", () => {
    state.cols++;
    createTable();
    renderStateValues();
});

document.getElementById("clearSheet").addEventListener("click", () => {
    localStorage.removeItem("spreadsheetState");
    state = { rows: 10, cols: 5, cells: {} };
    formulaBar.value = "";
    createTable();
});

function saveData() {
    localStorage.setItem("spreadsheetState", JSON.stringify(state));
}

function renderStateValues() {
    Object.keys(state.cells).forEach(cellId => {
        const el = document.getElementById(cellId);
        if (el) {
            el.textContent = state.cells[cellId].computedValue;
        }
    });
}

function initApp() {
    const saved = localStorage.getItem("spreadsheetState");
    if (saved) {
        state = JSON.parse(saved);
    }
    createTable();
    renderStateValues();
}

initApp();