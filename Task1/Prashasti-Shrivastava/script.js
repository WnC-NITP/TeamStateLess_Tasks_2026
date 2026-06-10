const table = document.getElementById("spread-table");
let rowCnt = 6; 
let colCnt = 5; 

// Track which cell is currently clicked
let activeCellId = null;

function createTable() {
    table.innerHTML = ""; 

    // Row for headings A, B, C...
    let headerRow = document.createElement("tr");
    let cornerCell = document.createElement("th");
    headerRow.appendChild(cornerCell);

    for (let j = 0; j < colCnt; j++) {
        let th = document.createElement("th");
        th.innerText = String.fromCharCode(65 + j); 
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    // Rows for actual content
    for (let i = 1; i <= rowCnt; i++) {
        let row = document.createElement("tr");
        let rowLabel = document.createElement("td");
        rowLabel.innerText = i; 
        rowLabel.style.fontWeight = "bold";
        rowLabel.style.textAlign = "center";
        row.appendChild(rowLabel);
       
        for (let j = 0; j < colCnt; j++) {
            let cell = document.createElement("td");
            let input = document.createElement("input");
            input.type = "text";

            let colLetter = String.fromCharCode(65 + j);
            input.id = `${colLetter}${i}`; 

            input.style.width = "100%";
            input.style.border = "none";
            input.style.outline = "none";

            // Track when a user clicks into this specific cell
            input.addEventListener('focus', () => {
                activeCellId = input.id; // Remember this cell ID globally
                
                // Update top bars
                document.getElementById("selected-cell-id").innerText = activeCellId;
                document.getElementById("formula-bar-input").value = input.value;
            });

            // IMP: If user updates cell directly, keep formula bar in sync
            input.addEventListener('input', () => {
                document.getElementById("formula-bar-input").value = input.value;
            });

           
input.addEventListener('blur', () => {
    let val = input.value.trim();

    // Check if it's a formula and looks like =A1+B1 (Length 6 check keeps it simple)
    if (val.startsWith("=") && val.includes("+") && val.length === 6) {
        
     
        let parts = val.substring(1).split("+"); 
        let firstCellId = parts[0];
        let secondCellId = parts[1];

        // Grab the elements from your grid using their IDs
        let cell1 = document.getElementById(firstCellId);
        let cell2 = document.getElementById(secondCellId);

        // Get their numeric values (default to 0 if the cell is empty)
        let num1 = cell1 && cell1.value ? Number(cell1.value) : 0;
        let num2 = cell2 && cell2.value ? Number(cell2.value) : 0;

        // Calculate the sum and replace the formula with the answer
        input.value = num1 + num2;
    }
});

            cell.appendChild(input);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

// 1. Sync formula bar typing down to the active cell
document.getElementById("formula-bar-input").addEventListener('input', (e) => {
    if (activeCellId) {
        document.getElementById(activeCellId).value = e.target.value;
    }
});

document.getElementById("add-row").addEventListener("click", () => {
    rowCnt++;
    createTable(); 
});


document.getElementById("add-col").addEventListener("click", () => {
    colCnt++;
    createTable(); 
});


createTable();