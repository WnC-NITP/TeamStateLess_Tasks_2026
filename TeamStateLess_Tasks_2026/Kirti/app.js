
const grid=document.querySelector(".grid");
const cellValue=document.querySelector("#cellValue");
const row=document.querySelector("#row");
const column=document.querySelector("#column");
const save=document.querySelector("#save");
const clear=document.querySelector("#clear");
const cellV=document.querySelector("#fill");
const modeButton=document.querySelector("#mode");
const body=document.querySelector("body");


let sheetData={};
let n_rows=5;
let n_columns=3;
let activeCellInput=null;
let currMode="Light";

function buildGrid(){

    let gridString="";
    grid.style.gridTemplateColumns = `repeat(${n_columns+1}, 1fr)`;


    for(let r=0; r<=n_rows; r++){
        for(let c=0; c<=n_columns; c++){
            // let letter = String.fromCharCode(65+c);
            // let cellId = letter+r;

            // gridString+=`<input type="text" class="cell" data-id="${cellId}" placeholder="${cellId}">`;
            if (r === 0 && c === 0) {
                gridString += `<div class="grid-header-cell clear-corner"></div>`;
            }else if(r===0){
                let letter = String.fromCharCode(65 + (c - 1)); 
                gridString += `<div class="grid-header-cell">${letter}</div>`;
            }else if (c === 0) {
                gridString += `<div class="grid-header-cell">${r}</div>`;
            }else {
                let letter = String.fromCharCode(65 + (c - 1));
                let cellId = letter + r;
                gridString += `<input type="text" class="cell" data-id="${cellId}" placeholder="${cellId}">`;
            };
        };
    };

    grid.innerHTML=gridString;

    const allInputs=document.querySelectorAll(".cell");

    allInputs.forEach((input) => {
        input.addEventListener("blur", (e) => {
        let cellId=e.target.dataset.id;
        let userText=e.target.value.trim();

        sheetData[cellId]=userText;
        let computedResult = evaluateFormula(userText);
        e.target.value = computedResult;

        console.log("Stored value is: ", sheetData);
        });

        input.addEventListener("focus", (e)=>{
        let cellId=e.target.dataset.id;

        activeCellInput=e.target;
        cellV.value = sheetData[cellId] || "";

        cellValue.innerText=cellId;

        if (sheetData[cellId]) {
        e.target.value = sheetData[cellId];
        };

        cellV.addEventListener("input", () => {
    if (!activeCellInput) return; 

    let cellId = activeCellInput.dataset.id;
    let text = cellV.value;

    activeCellInput.value = text;
    sheetData[cellId] = text;
});


cellV.addEventListener("change", () => {
    if (!activeCellInput) return;

    let text = cellV.value.trim();
    
    let computedResult = evaluateFormula(text);
    activeCellInput.value = computedResult;
});
        });
    });
};


const savedVault = localStorage.getItem("mySpreadsheetData");

if (savedVault) {
    sheetData = JSON.parse(savedVault);
};


buildGrid();


Object.keys(sheetData).forEach(cellId => {
    const matchingInput = document.querySelector(`[data-id="${cellId}"]`);
    if (matchingInput) {
        matchingInput.value = evaluateFormula(sheetData[cellId]);
    };
});


function addRow(){
    n_rows++;
    buildGrid();
};

function addColumn(){
    n_columns++;
    buildGrid();
};

function saveButton(){
    localStorage.setItem("mySpreadsheetData", JSON.stringify(sheetData));
    alert("Spreadsheet saved successfully!");
};

function clearButton(){
    sheetData={};
    buildGrid();
    alert("Spreadsheet successfully erased!");
};


function SUM(arr) {
    return arr.reduce((total, num) => total + Number(num), 0);
};

function AVG(arr) {
    if (arr.length === 0) return 0;
    return SUM(arr) / arr.length;
};

function MIN(arr) {
    return Math.min(...arr.map(Number));
};

function MAX(arr) {
    return Math.max(...arr.map(Number));
};

function expandRange(rangeStr) {
    let [start, end] = rangeStr.split(":");
    
    let startCol = start.match(/[A-Z]+/)[0];
    let startRow = parseInt(start.match(/\d+/)[0]);
    let endCol = end.match(/[A-Z]+/)[0];
    let endRow = parseInt(end.match(/\d+/)[0]);

    let startColCode = startCol.charCodeAt(0);
    let endColCode = endCol.charCodeAt(0);

    let cells = [];
    
   
    for (let col = startColCode; col <= endColCode; col++) {
        for (let row = startRow; row <= endRow; row++) {
            let letter = String.fromCharCode(col);
            cells.push(letter + row);
        }
    }
    return cells;
};

function evaluateFormula(formula) {
    if (!formula.startsWith('=')){
        return formula
    };

    let expression = formula.slice(1); 
    let rangeRegex = /(SUM|AVG|MIN|MAX)\(([A-Z]+\d+):([A-Z]+\d+)\)/g;
    
    expression = expression.replace(rangeRegex, (match, functionName, startCell, endCell) => {
        let allCellIds = expandRange(`${startCell}:${endCell}`);
        let valuesArray = allCellIds.map(cellId => {
            let val = sheetData[cellId] || "0";
           
            if (val.startsWith('=')) {
                return evaluateFormula(val);
            }
            return val;
        });
        return `${functionName}([${valuesArray.join(',')}])`;
    });

    
    let cellRegex = /[A-Z]+\d+/g;
    let matches = expression.match(cellRegex);
    if (matches) {
        matches.forEach(cellId => {
            let cellRawContent = sheetData[cellId] || "0";
            let finalNumericValue = cellRawContent.startsWith('=') ? evaluateFormula(cellRawContent) : cellRawContent;
            expression = expression.replace(cellId, finalNumericValue);
        });
    }

    try {
        return eval(expression); 
    } catch (error) {
        return "ERROR";
    }
};


row.addEventListener("click", addRow);
column.addEventListener("click", addColumn);
save.addEventListener("click", saveButton);
clear.addEventListener("click", clearButton);


modeButton.addEventListener("click", ()=>{

    if(currMode==="Light"){
        body.style.backgroundColor="black";
        currMode="Dark";
    }else{
        currMode="Light";
        body.style.backgroundColor="white";
    };
});