import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "python"))

from harness import run  # noqa: E402

# Same inputs as the sample run in the project document.
SAMPLE = [
    "2", "500", "10", "100",
    "Jane", "P", "p", "P", "P", "P",
    "Giel", "L", "P", "A", "P", "L",
]


def test_sample_run_matches_document():
    payroll, grand_total, console = run(SAMPLE)
    jane, giel = payroll

    assert jane == {
        "name": "Jane",
        "attendance": dict.fromkeys(("Monday", "Tuesday", "Wednesday", "Thursday", "Friday"), "P"),
        "days_worked": 5,
        "late_days": 0,
        "salary": 2600.0,
        "bonus": 100.0,
    }
    assert giel["attendance"] == {
        "Monday": "L", "Tuesday": "P", "Wednesday": "A", "Thursday": "P", "Friday": "L",
    }
    assert (giel["days_worked"], giel["late_days"], giel["salary"], giel["bonus"]) == (4, 2, 1980.0, 0.0)
    assert grand_total == 4580.0

    assert "Was Jane present on Tuesday? (P/A/L): p\n" in console
    assert "Bonus Applied: ₱100.00" in console
    assert "Final Salary: ₱1980.00" in console
    assert "Grand Total Payroll: ₱4580.00" in console


def test_bad_input_is_reprompted_like_the_terminal():
    payroll, _, console = run(["two", "1", "abc", "300", "0", "0", "Ana", "x", "A", "A", "A", "A", "A"])

    assert "Invalid number. Please enter a whole number." in console
    assert "Invalid number. Please enter a valid amount." in console
    assert "Invalid input. Please enter 'P', 'A', or 'L'." in console
    assert payroll[0]["days_worked"] == 0
    assert payroll[0]["salary"] == 0.0


def test_running_out_of_answers_stops_instead_of_hanging():
    with pytest.raises(RuntimeError, match="No answer left"):
        run(["1", "500"])
