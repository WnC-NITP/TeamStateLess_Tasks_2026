# TASK 1 - A Spreadsheet Application

## Overview of the complete task

Build a Spreadsheet Application using only HTML, CSS and JavaScript.

A spreadsheet is a grid-based application used to store, organize and manipulate data. Applications such as Microsoft Excel and Google Sheets are popular examples.

Your task is to build a simplified spreadsheet that supports editable cells, formulas and dynamic data updates.

The purpose of this project is to strengthen your understanding of JavaScript, DOM manipulation, state management and browser APIs through a real-world frontend application.

---

## Features

### Level 1 - Core Spreadsheet

#### Editable Spreadsheet

Create a spreadsheet consisting of rows and columns.

Example:

```text
      A      B      C

1    100    200

2    150    300
```

Users should be able to:

- Edit any cell
- Add rows and columns
- Select and highlight cells
- Save data using Local Storage
- Clear the spreadsheet

---

#### Formula Engine

Support formulas such as:

```text
=A1+B1
=A1-B1
=A1*B1
=A1/B1

=SUM(A1:A5)
=AVG(A1:A5)
=MIN(A1:A5)
=MAX(A1:A5)
```

Display the original formula in a Formula Bar when a cell is selected.

Handle invalid formulas gracefully.

Example:

```text
=A1+

Output:
Invalid Formula
```

---

### Level 2 - Advanced Features

#### Automatic Updates

Formula cells should update automatically when referenced cells change.

Example:

```text
A1 = 10
B1 = 20

C1 = =A1+B1
```

Result:

```text
C1 = 30
```

If A1 becomes 50:

```text
C1 = 70
```

---

#### Dependency Tracking

Support formulas depending on other formulas.

Example:

```text
A1 = 10

B1 = =A1+5

C1 = =B1+5
```

Updating A1 should automatically update B1 and C1.

---

#### Additional Features

- Search Functionality
- Keyboard Navigation
- Undo / Redo
- Auto Save

---

### Level 3 - Optional (For Practice & Exploration)

Implement any of the following:

- CSV Import / Export
- Sort Data
- Multiple Sheets
- Dark Mode
- Copy / Paste Support
- Freeze Header Row
- Formula Suggestions
- Cell Formatting
- Conditional Formatting
- Data Validation
- Context Menu (Right Click Options)

---

## Sample Layout

<img width="1672" height="941" alt="image" src="https://github.com/user-attachments/assets/881f0cee-0beb-4b7d-a9d9-4a124a23815f" />

The above layout is only a basic reference.

Feel free to enhance the design,features,usability and overall user experience.
---

## Tech Stack

### Allowed

- HTML
- CSS
- JavaScript

### Not Allowed
- React
- Vue
- Angular
- jQuery
- Bootstrap
- Tailwind CSS
- Any External Library
---

## What You Will Learn

By building this project, you will get hands-on experience with:

- DOM Manipulation
- Event Handling
- State Management
- Formula Parsing
- Dependency Tracking
- Browser Storage
- File Handling APIs
- Frontend Application Architecture
  
## A Note on AI Usage

For this task, we strongly encourage you not to use AI tools for generating code. Spend time understanding the problem, reading documentation, experimenting with different approaches and debugging issues on your own.
Getting stuck, making mistakes and fixing bugs is an essential part of the learning process.
The goal is not just to complete the project, but to learn how such systems are designed and implemented.

Focus on building a reliable and maintainable application rather than simply adding features.

Think. Experiment. Debug. Learn.
