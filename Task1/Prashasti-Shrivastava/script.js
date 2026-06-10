const table = document.getElementById("spread-table");
let rowCnt = 6; 
let colCnt = 5; 

function createTable() {
    table.innerHTML = ""; 

   //row for headings a b c..
    let headerRow = document.createElement("tr");
    
    let cornerCell = document.createElement("th");
    headerRow.appendChild(cornerCell);

    for (let j = 0; j < colCnt; j++) {
        let th = document.createElement("th");
        // Convert number to Letter (65 is 'A', 66 is 'B'...)
        th.innerText = String.fromCharCode(65 + j); 
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

  //rows for actual content
    for (let i = 1; i <= rowCnt; i++) {
        let row = document.createElement("tr");
        let rowLabel = document.createElement("td");
        rowLabel.innerText = i; //first col will contain index of the row 1,2,3..
        rowLabel.style.fontWeight = "bold";
        rowLabel.style.textAlign = "center";
        row.appendChild(rowLabel);
       
        // Create the editable input grid cells
        for (let j = 0; j < colCnt; j++) {
            let cell = document.createElement("td");
           let input = document.createElement("input");
            input.type = "text";

            // Generate unique cell coordinate (e.g., A1, B2)
            let colLetter = String.fromCharCode(65 + j);
            input.id = `${colLetter}${i}`; 

            // Make the input box look like a seamless cell
            input.style.width = "100%";
            input.style.border = "none";
            input.style.outline = "none";

            cell.appendChild(input);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

createTable();
