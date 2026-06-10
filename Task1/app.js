const gridContainer = document.getElementById('grid-container');
const cellInfo = document.getElementById('cell-info');
let selectedcell = null;
const formulaInput = document.getElementById('formula-input');

const sheetData = {};

const savedData = JSON.parse(localStorage.getItem("spreadsheetData")) || {};
Object.assign(sheetData, savedData);

function getMaxRow(savedData){

    let maxRow = 20;

    for(let cellId in savedData){
        const rowNumber = parseInt(cellId.slice(1));

        if(rowNumber > maxRow)
            maxRow = rowNumber;
    }
    return maxRow;
}

function getMaxCol(savedData){

    let maxCol = 10;
    for(let cellId in savedData){

        const columnLetter = cellId[0];

        const columnNumber = columnLetter.charCodeAt(0) - 64;

        if(columnNumber > maxCol)
            maxCol = columnNumber;
    }
    return maxCol;
}

let row = getMaxRow(savedData);
let col = getMaxCol(savedData);


// it also looks like ...

// let savedData =
//     JSON.parse(localStorage.getItem("spreadsheetData"));

// if(!savedData){
//     savedData = {};
// }

function updateFormulaCells() {
    const allCells = document.querySelectorAll(".cell");

    allCells.forEach(cell => {
        const cellId = cell.dataset.cellId;

        if(sheetData[cellId]?.startsWith("=")){
            cell.textContent = evaluateFormula(sheetData[cellId]);
        }
    });
}

function setupCell(cell, cellId){

    cell.dataset.cellId = cellId;
    cell.contentEditable = true;

        // Step 3 and 4: Detect and highlight which cell is selected
        cell.addEventListener('click',(e)=>{
            // console.log(e.target.dataset.cellId);
            // console.log("CLICKED");

            cellInfo.textContent = `Selected Cell: ${e.target.dataset.cellId}`
            // selected colour changing style

            if(selectedcell){
                selectedcell.classList.remove("selected-cell");
            }

            e.target.classList.add("selected-cell");

            selectedcell = e.target;

            // formulaInput.value = sheetData[cellId] || "";
            const value = sheetData[cellId] || "";

            if(value.startsWith("=") &&
            evaluateFormula(value) === "Invalid Formula"){

                formulaInput.value = "Invalid Formula";
            }
            else{
                formulaInput.value = value;
            }

            // console.log(selectedcell);
        })

        // Step 5: Saves data when a cell is edited
        cell.addEventListener('blur',(e)=>{
            const cellId = e.target.dataset.cellId;
            const val = e.target.textContent.trim();

            if(val) sheetData[cellId] = val;
            else delete sheetData[cellId];

            updateFormulaCells();
            // renderSpreadsheet();
            // console.log(sheetData);
            })
        }
        

// =SUM function
function getRangeValues(range, visited){

    const parts = range.split(":");

    const startCell = parts[0];
    const endCell = parts[1];

    const columnLetter = startCell[0];

    const startRow = parseInt(startCell.slice(1));
    const endRow = parseInt(endCell.slice(1));

    const values = [];

    for(let row=startRow; row<=endRow; row++){

        const cellId = `${columnLetter}${row}`;
        values.push(getCellValue(cellId, visited));
    }
    
    return values;

}

function getCellValue(cellId, visited = new Set()){

    if(visited.has(cellId))
        return "Invalid Formula";

    visited.add(cellId);

    const value = sheetData[cellId];

    if(!value) return 0;

    if(value.startsWith("="))
        return evaluateFormula(value, visited);

    return Number(value) || 0;
}

//Make a function to track formulas
function evaluateFormula(formula, visited = new Set()){

    if(!formula.startsWith("="))
        return formula;

    // Implementing =SUM() logic
    if(formula.startsWith("=SUM(")){

        const range = formula.slice(5,-1);

        const values = getRangeValues(range, visited);

        let sum = 0;

        for(let val of values){
            sum += val;
        }
        
        return sum;
    }

    // =AVG
    if(formula.startsWith("=AVG(")){

        const range = formula.slice(5,-1);

        const values = getRangeValues(range,visited);

        let sum = 0;
        
        for(let val of values)
            sum += val;

        return sum/ values.length;
    }

    // =MIN
    if(formula.startsWith("=MIN(")){

        const range = formula.slice(5,-1);

        const values = getRangeValues(range, visited);

        return Math.min(...values);
    }

    // =MAX
    if(formula.startsWith("=MAX(")){

        const range = formula.slice(5,-1);

        const values = getRangeValues(range, visited);

        return Math.max(...values);
    }

    const expression = formula.slice(1);

    // values stores in parts as form of array is key(cellId)
    // find which operator is it.
    let operator;

    if(expression.includes("+")) operator = "+";
    else if(expression.includes("-")) operator = "-";
    else if(expression.includes("*")) operator = "*";
    else if(expression.includes("/")) operator = "/";

    if(!operator) return "Invalid Formula";
    
    const parts = expression.split(operator);
    if(parts.length !== 2) return "Invalid Formula";

    const firstCell = parts[0].trim();
    const secondCell = parts[1].trim();
    if(!firstCell || !secondCell)
    return "Invalid Formula";

    // to access data sheetData[cellId] parts[0] , parts[1] are cellId
    const value1 = getCellValue(firstCell, visited);
    const value2 = getCellValue(secondCell, visited);
    if(value1 === "Invalid Formula" || value2 === "Invalid Formula")
    return "Invalid Formula";

    // console.log("Formula:", formula);
    // console.log("Result:", value1 + value2);

    if(operator === "+") return value1 + value2;
    if(operator === "-") return value1 - value2;
    if(operator === "*") return value1 * value2;
    // maintain , if value2 = 0 then 
    if(operator === "/") return value2 === 0 ? "Error" : value1/value2;
    
}

// console.log(evaluateFormula("=A1+B1"));

// creating renderSpreadsheet()

function renderSpreadsheet(){

    // to destroy old grid 
    gridContainer.innerHTML = "";
    gridContainer.style.gridTemplateColumns = `repeat(${col+1}, 120px)`;

    for( let i=0; i<=row; i++){

    for(let j=0; j<=col; j++){

        const cell = document.createElement('div');

        if(i === 0 && j === 0){
            cell.classList.add("top-left-corner");
        }
        else if(i === 0 && j > 0){
            cell.classList.add("column-header");
            cell.textContent = String.fromCharCode(64+j);

        }
        else if(i > 0 && j === 0){
            cell.classList.add("row-header");
            cell.textContent = i;
        }
        else{
            // text content columnLetter+rowNumber

            cell.classList.add("cell");
            const columnLetter = String.fromCharCode(64+j);
            const cellId = `${columnLetter}${i}`
            
            
            // Restore values while creating cells.
            // cell mein b jyga and sheetData mein b.
            if(sheetData[cellId]){
                const value = sheetData[cellId];

                // console.log(
                //     "Cell:",
                //     cellId,
                //     "Stored:",
                //     value,
                //     "Display:",
                //     evaluateFormula(value)
                // );

                cell.textContent = evaluateFormula(value);
            }

            setupCell(cell,cellId);
        }
            
        gridContainer.appendChild(cell);

        }
    }

}

renderSpreadsheet();


formulaInput.addEventListener("blur",()=>{

    // direct formula bar m changes kiya , kisi cell ko click kre bina.
    if(!selectedcell) return ;

    // if selectedcell is not empty
    selectedcell.textContent = formulaInput.value;

    // which cell is selected
    const cellId = selectedcell.dataset.cellId;

    // if formula bar consists of any value
    if(formulaInput.value.trim()) sheetData[cellId] = formulaInput.value;
    else delete sheetData[cellId];  

    updateFormulaCells();
    // renderSpreadsheet();

})

// Buttons

const addRowBtn = document.getElementById("add-row-btn");

addRowBtn.addEventListener("click",()=>{

    row++;

    renderSpreadsheet();
    // console.log(row);
})


const addColBtn = document.getElementById('add-col-btn');

addColBtn.addEventListener("click", ()=>{
    col++;

    renderSpreadsheet();

})


const saveBtn = document.getElementById('save-btn');

saveBtn.addEventListener("click",()=>{

    localStorage.setItem(
        "spreadsheetData",
        JSON.stringify(sheetData)
    );

    alert("Spreadsheet Saved!");

});

const clearbtn = document.getElementById('clear-btn');

clearbtn.addEventListener("click",()=>{

    // 1. Clear all cells
    const allCells = document.querySelectorAll(".cell");

    allCells.forEach((cell) => {
        cell.textContent = "";
    });

    // 2. Clear Formula Bar
    formulaInput.value = "";

    // 3. Selected Cell
    cellInfo.textContent = "Selected Cell:";

    // 4. Make selectedcell to "null"
    if(selectedcell){
        selectedcell.classList.remove("selected-cell");
        selectedcell = null;
    }

    // 5. Emtpy sheetData
    for(let key in sheetData){
        delete sheetData[key];
    }

    // 6. Remove localStorage
    localStorage.removeItem("spreadsheetData");

    alert("Spreadsheet Cleared");
})

