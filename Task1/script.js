let spreadsheet=document.querySelector(".spreadsheet");
let clear=document.querySelector(".clear");
let selectedCell=null;
let totalRows=11;
let totalCols=11;
let addRow=document.querySelector(".rowinc");
let colAdd=document.querySelector(".colinc");
let formulaBar=document.querySelector("#formulaBar");
let sheetData=JSON.parse(localStorage.getItem("sheetData")) || {};


clear.addEventListener("click",()=>{
    sheetData={};
    localStorage.removeItem("sheetData");
    createSpreadsheet();
})
addRow.addEventListener("click",()=>{
    totalRows++;
    createSpreadsheet();
});
colAdd.addEventListener("click",()=>{
    totalCols++;
    createSpreadsheet();
})
 function createSpreadsheet(){

    spreadsheet.innerHTML="";
    spreadsheet.style.gridTemplateColumns =
    `50px repeat(${totalCols-1},100px)`;

spreadsheet.style.gridTemplateRows =
    `50px repeat(${totalRows-1},50px)`;

    for(let rows=1;rows<=totalRows;rows++){
    for(let cols=1;cols<=totalCols;cols++){
        let cell=document.createElement("div");
        cell.setAttribute("class","cell");
      
        spreadsheet.appendChild(cell);
        
        let char='A';



        //top let corner
        if(rows==1 && cols==1){
            cell.innerText="";
              cell.setAttribute("contenteditable","false");
        }
        else if (rows==1){    // for rows=1
            cell.innerText = String.fromCharCode(63 + cols);
              cell.setAttribute("contenteditable","false");

        }
        else if(cols==1){   //for col=1
            cell.innerText=rows-1;
              cell.setAttribute("contenteditable","false");

        }
        else{
              cell.setAttribute("contenteditable","true");
              cell.setAttribute("id", `${String.fromCharCode(63 + cols)}${rows - 1}`);
              
              if(sheetData[cell.id]){
              cell.innerText = sheetData[cell.id];
    }
              cell.addEventListener("input",()=>{
                sheetData[cell.id]=cell.innerText;
                localStorage.setItem("sheetData",JSON.stringify(sheetData));
                formulaBar.value=cell.innerText;
              })
        }
        
    cell.addEventListener("click",()=>{
        if(selectedCell){
            selectedCell.classList.remove("selected");


        }
        cell.classList.add("selected");
        selectedCell=cell;

    });

    
    }
   
}
 }
 createSpreadsheet();

 formulaBar.addEventListener("input",()=>{

if(selectedCell){
    if(formulaBar.value.startsWith("=")){
        evaluateFormula(formulaBar.value);
}
else{
    selectedCell.innerText = formulaBar.value;

            sheetData[selectedCell.id] = formulaBar.value;
}
}
 });
 
 function evaluateFormula(formula){
    formula=formula.slice(1);
    console.log(formula);
    let operator;
    if(formula.includes("+")){
        operator="+";
    }
    let parts=formula.split("+");
    let cell1=parts[0];
    let cell2=parts[1];

    let value1=Number(sheetData[cell1]);
     
     
        let value2;
        if(!isNaN(Number(cell2))){
            value2=Number(cell2);
        }
        else{
            value2=Number(sheetData[cell2]);
        }

    let result=value1+value2;
    selectedCell.innerText=result;
    sheetData[selectedCell.id]=result;
    localStorage.setItem("sheetData",JSON.stringify(sheetData));
     


 }
 document.addEventListener("keydown", (e) => {

    if (!selectedCell) return;

    let id = selectedCell.id;

    let col = id.charCodeAt(0);
    let row = Number(id.slice(1));

    if (e.key === "ArrowRight") {
        col++;
    }
    else if (e.key === "ArrowLeft") {
        col--;
    }
    else if (e.key === "ArrowUp") {
        row--;
    }
    else if (e.key === "ArrowDown") {
        row++;
    }
    else if (e.key === "Enter") {
        row++;
    }
    else {
        return;
    }

    let nextId =
        `${String.fromCharCode(col)}${row}`;

    let nextCell =
        document.getElementById(nextId);

    if (nextCell) {

        selectedCell.classList.remove("selected");
        nextCell.classList.add("selected");
        nextCell.focus();
        selectedCell = nextCell;
        formulaBar.value = nextCell.innerText;
    }

    e.preventDefault();
});
 


