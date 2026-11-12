import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowRight } from "@phosphor-icons/react";
import { highlight } from "../shared/highlight.jsx";
import { MAIN_SHA256, MAIN_SOURCE, SAMPLE, runPayroll, toAnswers } from "../shared/python.js";

gsap.registerPlugin(ScrollTrigger);

const Guilloche = lazy(() => import("../shared/Guilloche.jsx"));
const SEED = 4580;
const MICRO = "WEEKLY EMPLOYEE ATTENDANCE AND SALARY ".repeat(24);
const LINES = MAIN_SOURCE.replace(/\n$/, "").split("\n");
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const linesMatching = (needles) =>
  LINES.flatMap((line, i) => (needles.some((n) => line.trim().startsWith(n)) ? [i] : []));

const CONCEPTS = [
  {
    name: "Tuple",
    text: "DAYS holds the five working days. A tuple keeps them fixed and in order, so every employee is asked about the same week.",
    lines: linesMatching(["DAYS = ("]),
  },
  {
    name: "Dictionary",
    text: "attendance_records maps each day to P, A or L. emp_data then bundles one employee’s name, record, counts and salary.",
    lines: linesMatching([
      "attendance_records = {}",
      "attendance_records[day] = status",
      "emp_data = {",
      '"name": emp_name',
      '"attendance": attendance_records',
      '"days_worked": days_worked',
      '"late_days": late_days',
      '"salary": total_salary',
      '"bonus": bonus_applied',
    ]),
  },
  {
    name: "Loops",
    text: "One for loop walks the employees and another walks DAYS. while True keeps asking until the answer is P, A or L.",
    lines: linesMatching(["for i in range(num_employees):", "for day in DAYS:", "while True:", "for status in attendance_records.values():", "for emp in payroll_list:"]),
  },
  {
    name: "Conditionals",
    text: "if and elif turn each mark into days worked and late days. One more if pays the bonus only for five on-time days.",
    lines: linesMatching(["if status in ('P', 'A', 'L'):", "if status == 'P':", "elif status == 'L':", "if days_worked == 5 and late_days == 0:", "if emp['bonus'] > 0:"]),
  },
];

const BRIEF =
  "Record an employee’s daily attendance for five working days. Store the days in a tuple and attendance records in a dictionary. Calculate the number of days worked and the employee’s salary based on the given daily rate.";

/* Smooth scroll, keyboard paging for the presenter, and the progress rule. */
function usePresenter(progressRef) {
  useEffect(() => {
    const lenis = reduceMotion() ? null : new Lenis({ lerp: 0.12 });
    const raf = (time) => lenis.raf(time * 1000);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    const stops = () =>
      [...document.querySelectorAll("[data-stop]")].map((el) => Math.round(el.getBoundingClientRect().top + window.scrollY));
    const go = (dir) => {
      const y = window.scrollY;
      const list = stops();
      const target = dir > 0 ? list.find((s) => s > y + 4) : list.reverse().find((s) => s < y - 4);
      if (target == null) return;
      if (lenis) lenis.scrollTo(target, { duration: 0.9, easing: (t) => 1 - Math.pow(1 - t, 3) });
      else window.scrollTo(0, target);
    };
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t.closest?.("input, textarea, select, [data-keys-native]")) return;
      if (e.key === " " && t.closest?.("button, a")) return;
      if (["ArrowDown", "ArrowRight", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        go(1);
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    // Web fonts change line heights; re-measure every trigger once they are in.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    const progress = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
      },
    });

    return () => {
      window.removeEventListener("keydown", onKey);
      progress.kill();
      if (lenis) {
        gsap.ticker.remove(raf);
        lenis.destroy();
      }
    };
  }, [progressRef]);
}

function Cover() {
  const note = useRef(null);
  const rosette = useRef(null);

  useLayoutEffect(() => {
    const el = note.current;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(el.querySelectorAll("[data-print]"), { clipPath: "inset(0% 100% 0% 0%)", duration: 0.8, ease: "none", stagger: 0.2, delay: 0.25 });
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.7, ease: "power3.out" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.7, ease: "power3.out" });
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        rx(-y * 4);
        ry(x * 5);
        el.style.setProperty("--ovi", (x + 0.5).toFixed(3));
        if (rosette.current) rosette.current.uPhase.value = (SEED % 360) * 0.0174 + x * 1.4;
      };
      el.addEventListener("pointermove", move);
      return () => el.removeEventListener("pointermove", move);
    });
    return () => mm.revert();
  }, []);

  return (
    <section className="cover" data-stop aria-label="Title">
      <div className="cover__note" ref={note}>
        <span className="microprint cover__micro" aria-hidden="true">
          {MICRO}
        </span>
        <h1 className="cover__title" data-print>
          Weekly Employee Attendance and Salary
        </h1>
        <p className="cover__serial" data-print aria-label="Serial MP8 0004580">
          MP8 0004580
        </p>
        <Suspense fallback={<div className="cover__rosette" />}>
          <Guilloche seed={SEED} controlRef={rosette} className="cover__rosette" />
        </Suspense>
        <div className="cover__denom-wrap">
          <p className="cover__denom">
            <span className="cover__peso">₱</span>4,580<span className="cover__cents">.00</span>
          </p>
          <p className="cover__caption">Grand total payroll of the sample run, as printed by main.py</p>
        </div>
        <footer className="cover__sign">
          <div className="sig">
            <span className="sig__rule" aria-hidden="true" />
            <p>Mark Joseph F. Mangaring</p>
          </div>
          <div className="sig">
            <span className="sig__rule" aria-hidden="true" />
            <p>Marizze Julliane M. Ponce</p>
          </div>
        </footer>
        <div className="cover__base">
          <p className="cover__course">Fundamentals of Programming 1, Group Project Finals, Machine Problem 8</p>
          <p className="cover__keys">
            <kbd>Space</kbd> or <kbd>Arrow keys</kbd> to move through the presentation
          </p>
        </div>
        <span className="microprint cover__micro cover__micro--end" aria-hidden="true">
          {MICRO}
        </span>
      </div>
    </section>
  );
}

function Brief() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // The statement inks in word by word as it is read.
      gsap.fromTo(
        ref.current.querySelectorAll(".brief__word"),
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.05,
          scrollTrigger: { trigger: ref.current, start: "top 75%", end: "center 45%", scrub: true },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <section className="brief" data-stop ref={ref} aria-labelledby="brief-title">
      <h2 id="brief-title" className="sr-only">
        The problem
      </h2>
      <figure className="brief__quote">
        <blockquote className="brief__text">
          {BRIEF.split(" ").map((word, i) => (
            <span className="brief__word" key={i}>
              {word}{" "}
            </span>
          ))}
        </blockquote>
        <figcaption>Machine Problem 8: Weekly Employee Attendance and Salary</figcaption>
      </figure>
      <div className="brief__req">
        <h3>Required concepts</h3>
        <ul>
          {["Tuples", "Dictionaries", "Loops", "Conditional statements"].map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const lineList = (lines) => (lines.length === 1 ? `Line ${lines[0] + 1}` : `Lines ${lines.map((l) => l + 1).join(", ")}`);

function Concepts() {
  const ref = useRef(null);
  const panel = useRef(null);
  const [active, setActive] = useState(0);

  // Whichever concept crosses the middle of the screen is the one being explained.
  useEffect(() => {
    const els = [...ref.current.querySelectorAll(".concept")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(els.indexOf(entry.target));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const first = panel.current?.querySelector(`[data-line="${CONCEPTS[active].lines[0]}"]`);
    if (!first) return;
    panel.current.scrollTo({ top: first.offsetTop - panel.current.clientHeight * 0.3, behavior: reduceMotion() ? "auto" : "smooth" });
  }, [active]);

  const on = new Set(CONCEPTS[active].lines);

  return (
    <section className="concepts" ref={ref} aria-labelledby="concepts-title">
      <h2 id="concepts-title" className="sr-only">
        The concepts in the code
      </h2>
      <div className="code" ref={panel} tabIndex={0} aria-label="Source of python/main.py" data-keys-native data-lenis-prevent>
        <p className="code__file">python/main.py</p>
        <ol>
          {LINES.map((line, i) => (
            <li key={i} data-line={i} data-on={on.has(i) ? true : undefined}>
              <span className="code__ln" aria-hidden="true">
                {i + 1}
              </span>
              <code>{line ? highlight(line) : " "}</code>
            </li>
          ))}
        </ol>
      </div>
      <div className="concepts__list">
        {CONCEPTS.map((c, i) => (
          <article key={c.name} className="concept" data-stop data-active={active === i ? true : undefined}>
            <h3>{c.name}</h3>
            <p>{c.text}</p>
            <p className="concept__lines">{lineList(c.lines)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const ROWS = [
  { name: "Jane", worked: 5, rate: "₱500", late: 0, deduction: "₱10", bonus: "₱100", salary: "₱2,600.00" },
  { name: "Giel", worked: 4, rate: "₱500", late: 2, deduction: "₱10", bonus: "₱0", salary: "₱1,980.00" },
];
const TERMS = ["days_worked", "×", "daily_rate", "−", "late_days", "×", "late_deduction", "+", "bonus", "=", "salary"];

function Formula() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 65%", end: "bottom 80%", scrub: true } });
      TERMS.forEach((_, col) => {
        tl.fromTo(ref.current.querySelectorAll(`[data-col="${col}"]`), { opacity: 0.12 }, { opacity: 1, ease: "none", duration: 1 }, col * 0.6);
      });
    });
    return () => mm.revert();
  }, []);

  const op = (t) => ["×", "−", "+", "="].includes(t);

  return (
    <section className="formula" data-stop ref={ref} aria-labelledby="formula-title">
      <h2 id="formula-title">How the salary is computed</h2>
      <p className="formula__rule">
        <code>bonus</code> is <code>perfect_bonus</code> only when <code>days_worked</code> is 5 and <code>late_days</code> is 0. Otherwise it is
        nothing.
      </p>
      <div className="formula__scroll">
        <table className="formula__table">
          <caption className="sr-only">Salary for the two employees in the sample run</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Employee</span>
              </th>
              {TERMS.map((t, col) =>
                op(t) ? (
                  <td key={col} data-col={col} className="formula__op" aria-hidden="true">
                    {t}
                  </td>
                ) : (
                  <th key={col} scope="col" data-col={col}>
                    {t}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const values = [r.worked, "×", r.rate, "−", r.late, "×", r.deduction, "+", r.bonus, "=", r.salary];
              return (
                <tr key={r.name}>
                  <th scope="row">{r.name}</th>
                  {values.map((v, col) => (
                    <td key={col} data-col={col} className={op(v) ? "formula__op" : col === 10 ? "formula__total" : undefined} aria-hidden={op(v) || undefined}>
                      {v}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SampleRun() {
  const ref = useRef(null);
  const tape = useRef(null);
  const [run, setRun] = useState({ status: "loading" });

  useEffect(() => {
    let alive = true;
    // Let the cover draw first; Python is a few megabytes.
    const timer = setTimeout(() => {
      runPayroll(toAnswers(SAMPLE)).then(
        (out) => alive && setRun({ status: "done", lines: out.console.replace(/\n$/, "").split("\n") }),
        () => alive && setRun({ status: "error" }),
      );
    }, 1200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  useLayoutEffect(() => {
    if (run.status !== "done") return undefined;
    const el = tape.current;
    // The payoff is the report and grand total, so the tape always comes to rest on it.
    const reportTop = () => {
      const line = [...el.querySelectorAll(".tape__line")].find((l) => l.textContent.includes("Final Payroll Report"));
      return line ? line.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 16 : el.scrollHeight;
    };
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lines = el.querySelectorAll(".tape__line");
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 55%", once: true } });
      tl.from(lines, { opacity: 0, duration: 0.01, stagger: 0.045, ease: "none" });
      tl.fromTo(el, { scrollTop: 0 }, { scrollTop: reportTop, ease: "none", duration: lines.length * 0.045 }, 0);
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      el.scrollTop = reportTop();
    });
    return () => mm.revert();
  }, [run.status]);

  return (
    <section className="run" data-stop ref={ref} aria-labelledby="run-title">
      <div className="run__text">
        <h2 id="run-title">The sample run</h2>
        <p>
          Two employees at ₱500 a day, ₱10 off for each late day and a ₱100 bonus for a perfect week. Jane was present all five days. Giel was late
          twice and absent once.
        </p>
        <p className="run__status" role="status">
          {run.status === "loading" && "Starting Python in this browser…"}
          {run.status === "done" && "Printed just now by python/main.py, running in this browser."}
          {run.status === "error" && "Python could not start here. The payroll page can retry."}
        </p>
      </div>
      <div className="tape" ref={tape} tabIndex={0} aria-label="main.py console output" data-keys-native data-lenis-prevent>
        {run.status === "done" ? (
          <pre>
            {run.lines.map((line, i) => (
              <span className="tape__line" key={i}>
                {line || " "}
                {"\n"}
              </span>
            ))}
          </pre>
        ) : (
          <div className="tape__blank" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ width: `${40 + ((i * 37) % 55)}%` }} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Deck() {
  const progress = useRef(null);
  usePresenter(progress);

  return (
    <>
      <main className="deck">
        <Cover />
        <Brief />
        <Concepts />
        <Formula />
        <SampleRun />
        <section className="demo" data-stop aria-labelledby="demo-title">
          <h2 id="demo-title">Run it live</h2>
          <p>Same program, your numbers. Enter a week of attendance for anyone and issue the payroll.</p>
          <a className="btn btn--primary demo__cta" href="../">
            Open the payroll <ArrowRight size={20} weight="bold" aria-hidden="true" />
          </a>
        </section>
        <section className="close" data-stop aria-labelledby="close-title">
          <div className="close__note">
            <span className="microprint" aria-hidden="true">
              {MICRO}
            </span>
            <h2 id="close-title">Thank you</h2>
            <div className="close__names">
              <p>Mark Joseph F. Mangaring</p>
              <p>Marizze Julliane M. Ponce</p>
            </div>
            <p className="close__course">Fundamentals of Programming 1, Group Project Finals</p>
            <p className="close__hash">
              The payroll page runs this exact file.
              <br />
              python/main.py SHA-256 <code>{MAIN_SHA256}</code>
            </p>
            <span className="microprint" aria-hidden="true">
              {MICRO}
            </span>
          </div>
        </section>
      </main>
      <div className="progress" ref={progress} aria-hidden="true" />
    </>
  );
}
