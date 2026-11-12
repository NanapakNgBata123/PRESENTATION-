// Runs Pyodide off the main thread so loading Python never freezes the page's animation.
import mainSource from "../../python/main.py?raw";
import harnessSource from "../../python/harness.py?raw";

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
const HOME = "/home/pyodide";

let ready;

function load() {
  ready ??= (async () => {
    const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`);
    const py = await loadPyodide({ indexURL: PYODIDE_URL });
    py.FS.writeFile(`${HOME}/main.py`, mainSource);
    py.FS.writeFile(`${HOME}/harness.py`, harnessSource);
    py.runPython(`import sys\nif "${HOME}" not in sys.path: sys.path.insert(0, "${HOME}")`);
    // Import the harness (runpy, unittest.mock) now, so the first payroll run is instant.
    py.runPython("import harness");
    return { py, version: py.runPython("import sys; sys.version.split()[0]") };
  })().catch((error) => {
    ready = undefined; // let the next request retry the download
    throw error;
  });
  return ready;
}

function run(py, answers) {
  const harness = py.pyimport("harness");
  const args = py.toPy(answers);
  let result;
  try {
    result = harness.run(args);
    const [payroll, grandTotal, consoleText] = result.toJs({ dict_converter: Object.fromEntries });
    return { payroll, grandTotal, console: consoleText };
  } finally {
    result?.destroy();
    args.destroy();
    harness.destroy();
  }
}

self.onmessage = async ({ data }) => {
  const { id, type, answers } = data;
  try {
    const { py, version } = await load();
    self.postMessage({ id, ok: true, value: type === "run" ? run(py, answers) : { version } });
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error?.message || error) });
  }
};
