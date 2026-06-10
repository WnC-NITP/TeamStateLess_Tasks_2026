
    const table= document.getElementById("table");
    const formulaBar = document.getElementById("formulaBar");
    let undoStack = [];
    let redoStack = [];
    let isApplyingHistory = false;
    let selectedCell = null;

    function updateCellIds() {
        for (let r = 1; r < table.rows.length; r++) {
            const row = table.rows[r];
            for (let c = 1; c < row.cells.length; c++) {
                const colName = String.fromCharCode(64 + c);
                row.cells[c].id = `${colName}${r}`;
            }
        }
    }

    function getCellLabel(cell) {
        if (!cell || cell.tagName !== "TD") return "";
        const colName = String.fromCharCode(64 + cell.cellIndex);
        const rowName = cell.parentElement.rowIndex;
        return `${colName}${rowName}`;
    }

    function getTableState() {
        const rows = [];
        for (let r = 1; r < table.rows.length; r++) {
            const row = table.rows[r];
            const rowData = [];
            for (let c = 1; c < row.cells.length; c++) {
                const cell = row.cells[c];
                rowData.push({
                    value: cell.innerText,
                    formula: cell.dataset.formula || null
                });
            }
            rows.push(rowData);
        }
        return { rows, cols: table.rows[0].cells.length - 1 };
    }

    function applyTableState(state) {
        isApplyingHistory = true;
        const desiredRows = state.rows.length + 1;
        const desiredCols = state.cols + 1;

        while (table.rows.length < desiredRows) {
            addrow();
        }
        while (table.rows.length > desiredRows) {
            table.deleteRow(table.rows.length - 1);
        }

        for (let r = 1; r < table.rows.length; r++) {
            const row = table.rows[r];
            while (row.cells.length < desiredCols) {
                row.insertCell();
            }
            while (row.cells.length > desiredCols) {
                row.deleteCell(row.cells.length - 1);
            }
            for (let c = 1; c < desiredCols; c++) {
                const cell = row.cells[c];
                const cellState = state.rows[r - 1][c - 1] || { value: "", formula: null };
                if (cellState.formula) {
                    cell.dataset.formula = cellState.formula;
                } else {
                    delete cell.dataset.formula;
                }
                cell.innerText = cellState.formula ? "" : cellState.value;
            }
        }

        updateCellIds();
        updateAllFormulas();
        saveState();
        isApplyingHistory = false;
    }

    function pushHistory() {
        if (isApplyingHistory) return;
        undoStack.push(getTableState());
        if (undoStack.length > 50) undoStack.shift();
        redoStack = [];
    }

    function undo() {
        if (!undoStack.length) return;
        const currentState = getTableState();
        redoStack.push(currentState);
        const state = undoStack.pop();
        applyTableState(state);
    }

    function redo() {
        if (!redoStack.length) return;
        const currentState = getTableState();
        undoStack.push(currentState);
        const state = redoStack.pop();
        applyTableState(state);
    }

    function saveState() {
        const state = getTableState();
        localStorage.setItem("spreadsheetState", JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem("spreadsheetState");
        if (!saved) return false;
        try {
            const state = JSON.parse(saved);
            if (state && state.rows) {
                applyTableState(state);
                return true;
            }
        } catch (error) {
            console.warn("Failed to load saved state", error);
        }
        return false;
    }

    function getCellValue(cellId, seen = new Set()) {
        if (seen.has(cellId)) return 0;
        seen.add(cellId);
        const cell = document.getElementById(cellId);
        if (!cell) return 0;
        if (cell.dataset.formula) {
            const value = evaluateFormula(cell.dataset.formula, seen, cellId);
            return Number(value) || 0;
        }
        return Number(cell.innerText) || 0;
    }

    formulaBar.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && selectedCell) {
            pushHistory();
            const value = formulaBar.value;
            if (value.startsWith("=")) {
                selectedCell.dataset.formula = value;
                selectedCell.innerText = evaluateFormula(value, new Set(), selectedCell.id);
            } else {
                delete selectedCell.dataset.formula;
                selectedCell.innerText = value;
            }
            updateCellIds();
            updateAllFormulas();
            saveState();
        }
    });

    table.addEventListener("click",function(event){
        if (event.target.tagName=== "TD"){
            const cell=event.target;
            selectedCell = cell;
            const p1=document.getElementById("p3");
            p1.innerHTML = getCellLabel(cell);
            formulaBar.value = cell.dataset.formula || cell.innerText;
            let input=document.createElement("input");
            input.type="text";
            input.value = cell.dataset.formula || cell.innerText;
            cell.innerHTML = "";
            cell.appendChild(input);
            input.focus();
            input.addEventListener("keydown",function(e){
                if(e.key==="Enter"){
                    pushHistory();
                    const value = input.value;
                    if (value.startsWith("=")) {
                        cell.dataset.formula = value;
                        cell.innerHTML = evaluateFormula(value, new Set(), cell.id);
                    } else {
                        delete cell.dataset.formula;
                        cell.innerHTML = value;
                    }
                    updateCellIds();
                    updateAllFormulas();
                    saveState();
                }
            })

        }

    })
   function addrow(){
        pushHistory();
        let table=document.getElementById("table");
        let newrow = table.insertRow();
        let th=document.createElement("th");
        newrow.appendChild(th);
        let c=table.rows[0].cells.length-1;
                while(c--){
        let cell= document.createElement("td");
         newrow.appendChild(cell);
    }
        updateCellIds();
        saveState();
    }
    function addcol(){
        pushHistory();
        let table=document.getElementById("table");
        for(let i=0;i<table.rows.length;i++){
            let row= table.rows[i];
            if(i==0){
              let  th=document.createElement("th");
              row.appendChild(th);
            }
            else{
                const td=document.createElement("td");
              row.appendChild(td);
            }
        } 
        updateCellIds();
        saveState();
    }
    function save(){
        saveState();
        alert("data is saved");
    }
    function clear1(){
        pushHistory();
        let table = document.getElementById("table");
        let row=table.rows;
        for(let i=1;i<row.length;i++){
            for (let j=1;j<row[i].cells.length;j++){
                delete row[i].cells[j].dataset.formula;
                row[i].cells[j].innerHTML="";
            }
        }
        updateAllFormulas();
        saveState();
    }
document.addEventListener("selectionchange",function(event){
        if (event.target.tagName==="TD"|| event.target.tagName==="TH"){
            const cell=event.target;
           cell.style.backgroundColor = "yellow";
            cell.style.fontWeight="bold";}
        }
    );
document.addEventListener("keydown", function(event) {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
    }
    if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "y" || ((event.key.toLowerCase() === "z") && event.shiftKey))) {
        event.preventDefault();
        redo();
    }
});

function clearSearchHighlights() {
    const cells = table.querySelectorAll("td");
    cells.forEach(cell => {
        cell.style.outline = "";
    });
}

function searchCells() {
    clearSearchHighlights();
    const query = document.getElementById("searchBox").value.trim().toLowerCase();
    if (!query) return;
    const cells = table.getElementsByTagName("td");
    for (let cell of cells) {
        const text = (cell.innerText || "").toLowerCase();
        const formula = (cell.dataset.formula || "").toLowerCase();
        if (text.includes(query) || formula.includes(query)) {
            cell.style.outline = "3px solid orange";
        }
    }
}
// Evaluate formulas
function evaluateFormula(formula, seen = new Set(), selfId) {
  try {
    if (!formula.startsWith("=")) return formula;
    formula = formula.substring(1);
    if (selfId) seen.add(selfId);

    // SUM, AVG, MIN, MAX
    if (formula.startsWith("SUM(")) return sumRange(formula.match(/\((.*?)\)/)[1], seen);
    if (formula.startsWith("AVG(")) return avgRange(formula.match(/\((.*?)\)/)[1], seen);
    if (formula.startsWith("MIN(")) return minRange(formula.match(/\((.*?)\)/)[1], seen);
    if (formula.startsWith("MAX(")) return maxRange(formula.match(/\((.*?)\)/)[1], seen);

    // Replace cell references with values
    formula = formula.replace(/[A-Z]\d+/g, ref => {
      const value = getCellValue(ref, new Set(seen));
      return isNaN(value) ? 0 : value;
    });

    return eval(formula);
  } catch (error) {
    return "Invalid Formula";
  }
}

// Range helpers
function getRangeValues(range, seen = new Set()) {
  const [start, end] = range.split(":");
  const startCol = start[0], startRow = parseInt(start.slice(1));
  const endCol = end[0], endRow = parseInt(end.slice(1));
  let values = [];
  for (let r = startRow; r <= endRow; r++) {
    const id = startCol + r;
    values.push(getCellValue(id, new Set(seen)));
  }
  return values;
}
function sumRange(range, seen = new Set()) { return getRangeValues(range, seen).reduce((a,b)=>a+b,0); }
function avgRange(range, seen = new Set()) {
  const vals = getRangeValues(range, seen);
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
}
function minRange(range, seen = new Set()) { const vals = getRangeValues(range, seen); return vals.length ? Math.min(...vals) : 0; }
function maxRange(range, seen = new Set()) { const vals = getRangeValues(range, seen); return vals.length ? Math.max(...vals) : 0; }

// Update all formulas
function updateAllFormulas() {
  const cells = table.querySelectorAll("td[data-formula]");
  for (let cell of cells) {
    cell.innerHTML = evaluateFormula(cell.dataset.formula, new Set(), cell.id);
  }
}

// Listen for edits
table.addEventListener("input", function(event) {
  const target = event.target;
  if (target.tagName === "INPUT" && target.parentElement.tagName === "TD") {
    if (!target.parentElement.dataset.formula) {
      updateAllFormulas();
    }
  }
});

updateCellIds();
if (!loadState()) {
  const exampleFormulas = [
    ["C1", "=A1+B1"],
    ["C2", "=SUM(A1:A3)"],
    ["C3", "=AVG(B1:B3)"],
    ["D1", "=MIN(A1:A3)"],
    ["D2", "=MAX(B1:B3)"]
  ];
  for (const [id, formula] of exampleFormulas) {
    const cell = document.getElementById(id);
    if (cell) {
      cell.dataset.formula = formula;
    }
  }
  updateAllFormulas();
  saveState();
}
