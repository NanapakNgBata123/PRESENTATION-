import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowCounterClockwise, Check, Plus, Trash, Warning } from "@phosphor-icons/react";
import { DAYS, MAIN_SHA256, SAMPLE, loadPython, runPayroll, toAnswers } from "../shared/python.js";
import PayNotes from "./PayNotes.jsx";

const AMOUNT = /^(\d+(\.\d*)?|\.\d+)$/;
const MAX_EMPLOYEES = 12;
const STATUS = { P: "Present", A: "Absent", L: "Late" };
const RATES = [
  { id: "daily_rate", key: "dailyRate", label: "Daily rate" },
  { id: "late_deduction", key: "lateDeduction", label: "Late deduction" },
  { id: "perfect_bonus", key: "perfectBonus", label: "Perfect attendance bonus" },
];
const EASE = [0.16, 1, 0.3, 1];

let nextId = 1;
const withIds = (list) => list.map((e) => ({ ...e, days: [...e.days], id: nextId++ }));

function usePython() {
  const [state, setState] = useState({ status: "loading" });
  const load = () => {
    setState({ status: "loading" });
    loadPython().then(
      ({ version }) => setState({ status: "ready", version }),
      (error) => setState({ status: "error", error: String(error?.message || error) }),
    );
  };
  useEffect(load, []);
  return [state, load];
}

function validate(rates, employees) {
  const errors = {};
  for (const { id, key } of RATES) {
    if (!AMOUNT.test(rates[key].trim())) errors[id] = "Enter an amount in pesos, like 500.";
  }
  for (const e of employees) {
    if (!e.name.trim()) errors[`name-${e.id}`] = "Enter a name.";
  }
  return errors;
}

const lastLine = (error) => String(error?.message || error).trim().split("\n").pop();

export default function App() {
  const [python, retryPython] = usePython();
  const [rates, setRates] = useState({ dailyRate: SAMPLE.dailyRate, lateDeduction: SAMPLE.lateDeduction, perfectBonus: SAMPLE.perfectBonus });
  const [employees, setEmployees] = useState(() => withIds(SAMPLE.employees));
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState({ status: "idle", run: 0 });
  const [tab, setTab] = useState("notes");
  const [active, setActive] = useState(null);

  const setDay = (id, d, code) =>
    setEmployees((list) => list.map((e) => (e.id === id ? { ...e, days: e.days.map((v, i) => (i === d ? code : v)) } : e)));
  const setName = (id, name) => setEmployees((list) => list.map((e) => (e.id === id ? { ...e, name } : e)));
  const add = () => setEmployees((list) => [...list, ...withIds([{ name: "", days: ["P", "P", "P", "P", "P"] }])]);
  const remove = (id) => {
    setEmployees((list) => list.filter((e) => e.id !== id));
    setActive(null);
  };
  const reset = () => {
    setRates({ dailyRate: SAMPLE.dailyRate, lateDeduction: SAMPLE.lateDeduction, perfectBonus: SAMPLE.perfectBonus });
    setEmployees(withIds(SAMPLE.employees));
    setErrors({});
  };

  async function issue(event) {
    event.preventDefault();
    const found = validate(rates, employees);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setResult((r) => ({ ...r, status: "running" }));
    try {
      const answers = toAnswers({
        dailyRate: rates.dailyRate.trim(),
        lateDeduction: rates.lateDeduction.trim(),
        perfectBonus: rates.perfectBonus.trim(),
        employees,
      });
      const out = await runPayroll(answers);
      setResult((r) => ({ status: "done", ...out, run: r.run + 1 }));
    } catch (error) {
      setResult((r) => ({ ...r, status: "error", error: lastLine(error) }));
    }
  }

  const ready = python.status === "ready";
  const busy = result.status === "running";

  return (
    <>
      <header className="bar">
        <a className="bar__mark" href="./">
          MP8 Payroll
        </a>
        <nav className="bar__nav" aria-label="Pages">
          <a href="./" aria-current="page">
            Payroll
          </a>
          <a href="./presentation/">Presentation</a>
        </nav>
        <p className="bar__status" role="status" data-state={python.status}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={python.status}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              {python.status === "loading" && "Loading Python in your browser…"}
              {python.status === "ready" && (
                <>
                  <Check size={16} weight="bold" aria-hidden="true" /> Python {python.version} ready
                </>
              )}
              {python.status === "error" && (
                <>
                  <Warning size={16} weight="bold" aria-hidden="true" /> Python could not load.{" "}
                  <button type="button" className="link-btn" onClick={retryPython}>
                    Try again
                  </button>
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </p>
      </header>

      <main className="desk">
        <form className="sheet" onSubmit={issue} noValidate>
          <div className="sheet__intro">
            <h1>Weekly payroll</h1>
            <p>
              Mark each employee present, absent or late for the week, then issue the payroll. Every number comes from the original{" "}
              <code>main.py</code>.
            </p>
          </div>

          <fieldset className="rates">
            <legend className="section-title">Rates</legend>
            {RATES.map(({ id, key, label }) => (
              <div className="field" key={id}>
                <label htmlFor={id}>
                  {label} <code>{id}</code>
                </label>
                <div className="field__input" data-invalid={errors[id] ? true : undefined}>
                  <span aria-hidden="true">₱</span>
                  <input
                    id={id}
                    inputMode="decimal"
                    autoComplete="off"
                    value={rates[key]}
                    onChange={(e) => setRates((r) => ({ ...r, [key]: e.target.value }))}
                    aria-invalid={errors[id] ? true : undefined}
                    aria-describedby={errors[id] ? `${id}-error` : undefined}
                  />
                </div>
                {errors[id] && (
                  <p className="field__error" id={`${id}-error`}>
                    {errors[id]}
                  </p>
                )}
              </div>
            ))}
          </fieldset>

          <fieldset className="ledger">
            <legend className="section-title">Attendance</legend>
            <div className="ledger__head" aria-hidden="true">
              <span>Name</span>
              {DAYS.map((d) => (
                <span key={d}>{d.slice(0, 3)}</span>
              ))}
              <span />
            </div>
            <AnimatePresence initial={false}>
              {employees.map((emp, i) => {
                const nameId = `name-${emp.id}`;
                const who = emp.name.trim() || `Employee ${i + 1}`;
                return (
                  <motion.div
                    key={emp.id}
                    className="ledger__row"
                    data-active={active === i ? true : undefined}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: EASE }}
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                  >
                    <div className="ledger__name">
                      <label htmlFor={nameId} className="sr-only">
                        Employee {i + 1} name
                      </label>
                      <input
                        id={nameId}
                        value={emp.name}
                        placeholder={`Employee ${i + 1}`}
                        autoComplete="off"
                        onChange={(e) => setName(emp.id, e.target.value)}
                        aria-invalid={errors[nameId] ? true : undefined}
                        aria-describedby={errors[nameId] ? `${nameId}-error` : undefined}
                      />
                      {errors[nameId] && (
                        <p className="field__error" id={`${nameId}-error`}>
                          {errors[nameId]}
                        </p>
                      )}
                    </div>
                    {DAYS.map((day, d) => (
                      <div key={day} className="day" role="radiogroup" aria-label={`${who}, ${day}`}>
                        <span className="day__label" aria-hidden="true">
                          {day.slice(0, 3)}
                        </span>
                        {["P", "A", "L"].map((code) => (
                          <label key={code} className="opt" data-code={code}>
                            <input
                              type="radio"
                              name={`day-${emp.id}-${d}`}
                              value={code}
                              checked={emp.days[d] === code}
                              onChange={() => setDay(emp.id, d, code)}
                            />
                            <span aria-hidden="true">{code}</span>
                            <span className="sr-only">{STATUS[code]}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => remove(emp.id)}
                      disabled={employees.length === 1}
                      aria-label={`Remove ${who}`}
                    >
                      <Trash size={18} aria-hidden="true" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <p className="ledger__legend">
              P present, A absent, L late. {employees.length} {employees.length === 1 ? "employee" : "employees"}, up to {MAX_EMPLOYEES}.
            </p>
            <div className="ledger__foot">
              <button type="button" className="btn btn--quiet" onClick={add} disabled={employees.length >= MAX_EMPLOYEES}>
                <Plus size={16} weight="bold" aria-hidden="true" /> Add employee
              </button>
              <button type="button" className="btn btn--quiet" onClick={reset}>
                <ArrowCounterClockwise size={16} weight="bold" aria-hidden="true" /> Reset to sample
              </button>
              <button type="submit" className="btn btn--primary btn--issue" disabled={!ready || busy}>
                {ready ? (busy ? "Issuing…" : "Issue payroll") : "Waiting for Python…"}
              </button>
            </div>
          </fieldset>
        </form>

        <section className="notes" aria-label="Payroll output">
          <div className="tabs" role="tablist" aria-label="Output view">
            {[
              { id: "notes", label: "Pay notes" },
              { id: "console", label: "Console" },
            ].map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls="output"
                className="tab"
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {tab === t.id && <motion.span layoutId="tab-ink" className="tab__ink" transition={{ duration: 0.25, ease: EASE }} />}
              </button>
            ))}
          </div>

          <div id="output" role="tabpanel" aria-labelledby={`tab-${tab}`} aria-live="polite" className="output">
            {result.status === "error" && (
              <div className="notice notice--error" role="alert">
                <Warning size={20} weight="bold" aria-hidden="true" />
                <p>
                  main.py stopped: {result.error} Check the rates and names, then issue the payroll again.
                </p>
              </div>
            )}
            {!result.payroll && result.status !== "error" && (
              <div className="empty">
                <p className="empty__title">{busy ? "Running main.py…" : "No payroll issued yet"}</p>
                <p>
                  {busy
                    ? "Python is typing your entries into main.py’s prompts."
                    : tab === "notes"
                      ? "Fill in the ledger and press Issue payroll. Each employee gets a numbered pay note."
                      : "After you issue the payroll, this shows exactly what main.py prints in a terminal."}
                </p>
              </div>
            )}
            {result.payroll &&
              (tab === "notes" ? (
                <PayNotes payroll={result.payroll} grandTotal={result.grandTotal} run={result.run} active={active} onActive={setActive} />
              ) : (
                <pre className="console" tabIndex={0} aria-label="main.py console output">
                  {result.console}
                </pre>
              ))}
          </div>
        </section>
      </main>

      <footer className="foot">
        <p>
          Machine Problem 8, Fundamentals of Programming 1. By Mark Joseph F. Mangaring and Marizze Julliane M. Ponce.
        </p>
        <p className="foot__hash">
          python/main.py SHA-256 <code>{MAIN_SHA256}</code>
        </p>
      </footer>
    </>
  );
}
