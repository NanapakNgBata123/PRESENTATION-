import { Suspense, lazy, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import CountUp from "../shared/CountUp.jsx";
import { DAYS, formatPeso } from "../shared/python.js";

const Guilloche = lazy(() => import("../shared/Guilloche.jsx"));

const STATUS = { P: "present", A: "absent", L: "late" };
const serial = (n) => `MP8 ${String(n).padStart(4, "0")}`;

// The numbering-machine roll; with reduced motion the amount is simply printed.
function Amount({ value, run, duration, delay }) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return formatPeso(value);
  return <CountUp key={run} to={value} mode="roll" separator="," decimals={2} prefix="₱" duration={duration} delay={delay} />;
}

// Each run prints its notes like a press: paper feeds down, one note after another.
export default function PayNotes({ payroll, grandTotal, run, active, onActive }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(".paynote", { clipPath: "inset(0% 0% 100% 0%)", duration: 0.5, ease: "none", stagger: 0.14 });
    }, ref);
    return () => ctx.revert();
  }, [run]);

  return (
    <div className="paynotes" ref={ref}>
      {payroll.map((e, i) => (
        <article
          key={`${run}-${i}`}
          className="paynote"
          data-active={active === i ? true : undefined}
          onPointerEnter={() => onActive(i)}
          aria-label={`Pay note for ${e.name}`}
        >
          <header className="paynote__head">
            <span className="paynote__serial">No. {serial(i + 1)}</span>
            {e.bonus > 0 && <span className="stamp">Perfect attendance +{formatPeso(e.bonus)}</span>}
          </header>
          <h3 className="paynote__name">{e.name}</h3>
          <ol className="strip" aria-label="Attendance">
            {DAYS.map((d) => (
              <li key={d} data-code={e.attendance[d]} aria-label={`${d}: ${STATUS[e.attendance[d]]}`}>
                <span aria-hidden="true">{d.slice(0, 2)}</span>
                <b aria-hidden="true">{e.attendance[d]}</b>
              </li>
            ))}
          </ol>
          <p className="paynote__counts">
            {e.days_worked} {e.days_worked === 1 ? "day" : "days"} worked, {e.late_days} late
          </p>
          <p className="paynote__amount">
            <Amount value={e.salary} run={run} duration={1.2} delay={0.25 + i * 0.14} />
          </p>
        </article>
      ))}

      <article className="paynote paynote--total" aria-label="Grand total payroll">
        <div className="paynote__total-text">
          <p className="paynote__amount paynote__amount--total">
            <Amount value={grandTotal} run={run} duration={1.6} delay={0.4} />
          </p>
          <p className="paynote__counts">
            Grand total payroll for {payroll.length} {payroll.length === 1 ? "employee" : "employees"}, printed by main.py
          </p>
        </div>
        <Suspense fallback={<div className="paynote__rosette" />}>
          <Guilloche seed={Math.round(grandTotal)} className="paynote__rosette" />
        </Suspense>
      </article>
    </div>
  );
}
