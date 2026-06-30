let rows = 8;
let cols = 8;

const table = document.getElementById("spreadsheet");

const saveBtn = document.getElementById("s");
const addRowBtn = document.getElementById("Row");
const addColBtn = document.getElementById("Col");
const formula = document.getElementById("formula");

let data = JSON.parse(localStorage.getItem("spreadsheetData")) || {};

let selectedCell = null;



const headerRow = document.createElement("tr");

const empty = document.createElement("th");
headerRow.appendChild(empty);

for(let i = 0; i < cols; i++){
    const th = document.createElement("th");
    th.textContent = String.fromCharCode(65 + i);
    headerRow.appendChild(th);
}

table.appendChild(headerRow);




for(let r = 1; r <= rows; r++){

    const tr = document.createElement("tr");

    const rowHeader = document.createElement("th");
    rowHeader.textContent = r;
    tr.appendChild(rowHeader);

    for(let c = 0; c < cols; c++){

        const td = document.createElement("td");

        td.contentEditable = true;

        const cellId = String.fromCharCode(65 + c) + r;

        td.dataset.cell = cellId;

      

        if(data[cellId]){
            td.innerText = data[cellId].value;
        }



        td.addEventListener("click", () => {

            if(selectedCell){
                selectedCell.classList.remove("selected");
            }

            selectedCell = td;
            td.classList.add("selected");

            formula.value = td.innerText;
        });

  

        td.addEventListener("blur", () => {

            let value = td.innerText;

            if(value.startsWith("=")){

                let result = calculateFormula(value);

                td.innerText = result;

                data[cellId] = {
                    value: result,
                    formula: value
                };

            }else{

                data[cellId] = {
                    value: value,
                    formula: null
                };
            }

        });

        tr.appendChild(td);
    }

    table.appendChild(tr);
}



function saveData(){

    localStorage.setItem(
        "spreadsheetData",
        JSON.stringify(data)
    );

    console.log("Saved");
}

saveBtn.addEventListener("click", saveData);

function calculateFormula(formula){

    let operator;

    if(formula.includes("+")){
        operator = "+";
    }

    else if(formula.includes("-")){
        operator = "-";
    }

    else if(formula.includes("*")){
        operator = "*";
    }

    else if(formula.includes("/")){
        operator = "/";
    }

    else{
        return "Invalid Formula";
    }

    let parts = formula.substring(1).split(operator);

    if(parts.length != 2){
        return "Invalid Formula";
    }

    let firstCell = parts[0];
    let secondCell = parts[1];

    let firstValue = Number(data[firstCell]?.value || 0);
    let secondValue = Number(data[secondCell]?.value || 0);

    if(operator == "+"){
        return firstValue + secondValue;
    }

    if(operator == "-"){
        return firstValue - secondValue;
    }

    if(operator == "*"){
        return firstValue * secondValue;
    }

    if(operator == "/"){

        if(secondValue == 0){
            return "Cannot Divide By 0";
        }

        return firstValue / secondValue;
    }
}
addRowBtn.addEventListener("click", () => {

    rows++;

    const tr = document.createElement("tr");

    const rowHeader = document.createElement("th");
    rowHeader.textContent = rows;

    tr.appendChild(rowHeader);

    for(let c = 0; c < cols; c++){

        const td = document.createElement("td");

        td.contentEditable = true;

        const cellId = String.fromCharCode(65 + c) + rows;

        td.dataset.cell = cellId;

        td.addEventListener("click", () => {

            if(selectedCell){
                selectedCell.classList.remove("selected");
            }

            selectedCell = td;
            td.classList.add("selected");

            formula.value = td.innerText;
        });

        td.addEventListener("blur", () => {

            let value = td.innerText;

            if(value.startsWith("=")){

                let result = calculateFormula(value);

                td.innerText = result;

                data[cellId] = {
                    value: result,
                    formula: value
                };

            }else{

                data[cellId] = {
                    value: value,
                    formula: null
                };
            }

        });

        tr.appendChild(td);
    }

    table.appendChild(tr);

});
addColBtn.addEventListener("click", () => {

    cols++;

    const th = document.createElement("th");
    th.textContent = String.fromCharCode(64 + cols);

    headerRow.appendChild(th);

    const allRows = table.querySelectorAll("tr");

    for(let r = 1; r < allRows.length; r++){

        const td = document.createElement("td");

        td.contentEditable = true;

        allRows[r].appendChild(td);
    }

});