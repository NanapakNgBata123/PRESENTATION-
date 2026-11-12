# Weekly Employee Attendance and Salary

Machine Problem 8 for Fundamentals of Programming 1, Group Project Finals.
By Mark Joseph F. Mangaring and Marizze Julliane M. Ponce.

> Record an employee's daily attendance for five working days. Store the days in a tuple and attendance records in a dictionary. Calculate the number of days worked and the employee's salary based on the given daily rate.

## What's in here

| Path | What it is |
| --- | --- |
| `python/main.py` | The program as submitted. It is never edited. |
| `python/harness.py` | Runs `main.py` with `input()` and `print()` swapped out, so a web page can answer its prompts and read what it prints. |
| `tests/test_main.py` | Checks the sample run from the project document: Jane ₱2600.00, Giel ₱1980.00, total ₱4580.00. |
| `index.html`, `src/app/` | The payroll page. |
| `presentation/index.html`, `src/deck/` | The presentation. |
| `src/shared/` | Pieces both pages use: the Python worker, the guilloche rosette, fonts and colours. |

## How the web page runs the original program

The pages are static. Python runs inside the browser through [Pyodide](https://pyodide.org), in a Web Worker so the page never freezes while it loads.

When you press **Issue payroll**, the page turns the form into the exact answers a person would type at `main.py`'s prompts (employee count, daily rate, late deduction, bonus, then each name and the five P/A/L marks) and runs `main.py` through `harness.py`. The pay notes come from the `payroll_list` and `grand_total` that `main.py` builds, and the **Console** tab shows exactly what it prints. Nothing about the salary is recalculated in JavaScript.

The footer and the last slide show the SHA-256 of `python/main.py`, taken when the pages are built, so anyone can check they run the same file.

## How to run it

You need an internet connection the first time: step 3 downloads the website's packages, and the pages download Python (about 6 MB) the first time they open.

### 1. Install Node.js (one time)

Download the **LTS** version from https://nodejs.org and install it with the default options. Version 20.19 or newer works.

Close and reopen your terminal afterwards, then check it worked:

```sh
node --version
```

It should print a version number such as `v24.11.0`.

### 2. Open a terminal in the project folder

Unzip the project if you got it as a `.zip`. Then open the folder in a terminal:

- **Windows:** open the `weekly-attendance-payroll` folder in File Explorer, click the address bar, type `powershell` and press Enter.
- **VS Code:** open the folder, then choose **Terminal > New Terminal**.
- **macOS / Linux:** `cd` into the folder.

### 3. Install the packages (one time)

```sh
npm install
```

This creates a `node_modules` folder. It can take a minute.

### 4. Start the website

```sh
npm run dev
```

Leave this terminal open. Then open these in your browser:

- Payroll page: http://localhost:5173/
- Presentation: http://localhost:5173/presentation/

If the terminal shows a different port (for example `5174`), use the address it prints. To stop the website, click the terminal and press `Ctrl + C`.

Opening `index.html` by double-clicking it does **not** work. The browser blocks the Python worker on `file://` pages, so always use `npm run dev`.

### Run the original program in a terminal (optional)

`python/main.py` has no dependencies. If you have Python 3 installed:

```sh
python python/main.py
```

With [uv](https://docs.astral.sh/uv/) installed you can also run it, and the tests, without setting up Python yourself:

```sh
uv run python/main.py
uv run pytest
```

### If something goes wrong

| Problem | Fix |
| --- | --- |
| `'npm' is not recognized` or `command not found: npm` | Node.js is not installed, or the terminal was opened before installing it. Install Node.js, then open a new terminal. |
| The page says "Loading Python in your browser…" for a long time | The first load downloads Python from the internet. Check your connection and refresh the page. |
| The page is blank | You opened the file directly. Use `npm run dev` and the `localhost` address. |
| `npm install` fails | Delete the `node_modules` folder and run `npm install` again. |

## Presenting

Open the presentation and press `F11` for full screen. Use the arrow keys, Page Up/Page Down or the space bar to move between sections.

The sample run section starts Python in the background when the page opens, so give it a few seconds. Open both pages once on the presenting laptop before class, while you have internet, so the browser has Python cached.

## Credits

- Built with React, Vite, GSAP, Motion, Lenis and Three.js.
- `src/shared/CountUp.jsx` is the CountUp component from [React Bits](https://reactbits.dev) by David Haz, used under its MIT + Commons Clause license.
- Fonts: Archivo and JetBrains Mono, both under the SIL Open Font License.
