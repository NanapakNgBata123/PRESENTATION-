// Talks to the Python worker, which runs the original python/main.py through python/harness.py.
import mainSource from "../../python/main.py?raw";

export const MAIN_SOURCE = mainSource;
export const MAIN_SHA256 = __MAIN_SHA256__;

let worker;
let nextId = 0;
const pending = new Map();

function call(type, payload) {
  worker ??= startWorker();
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, type, ...payload });
  });
}

function startWorker() {
  const w = new Worker(new URL("./python.worker.js", import.meta.url), { type: "module" });
  w.onmessage = ({ data }) => {
    const job = pending.get(data.id);
    pending.delete(data.id);
    if (data.ok) job?.resolve(data.value);
    else job?.reject(new Error(data.error));
  };
  w.onerror = (event) => {
    for (const job of pending.values()) job.reject(new Error(event.message || "The Python worker stopped."));
    pending.clear();
    w.terminate();
    worker = undefined;
  };
  return w;
}

/** Starts Python in the background; resolves with { version }. */
export const loadPython = () => call("load");

/**
 * Answers are the exact strings a person would type at main.py's prompts, in order:
 * employee count, daily rate, late deduction, perfect bonus, then for each employee
 * the name followed by Monday..Friday status.
 */
export const runPayroll = (answers) => call("run", { answers: answers.map(String) });

export const SAMPLE = {
  dailyRate: "500",
  lateDeduction: "10",
  perfectBonus: "100",
  employees: [
    { name: "Jane", days: ["P", "P", "P", "P", "P"] },
    { name: "Giel", days: ["L", "P", "A", "P", "L"] },
  ],
};

export function toAnswers({ dailyRate, lateDeduction, perfectBonus, employees }) {
  return [
    String(employees.length),
    dailyRate,
    lateDeduction,
    perfectBonus,
    ...employees.flatMap((e) => [e.name, ...e.days]),
  ];
}

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const peso = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatPeso = (value) => `₱${peso.format(value)}`;
