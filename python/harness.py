"""Runs main.py exactly as written, answering its input() prompts from a list.

main.py is never modified. It is executed with input() and print() swapped
for versions that read from the given answers and record everything the
program would have shown in a terminal.
"""
import os
import runpy
from pathlib import Path
from unittest import mock

MAIN = Path(__file__).with_name("main.py")


def run(answers, path=MAIN):
    """Return (payroll_list, grand_total, console_text) for one run of main.py."""
    pending = iter(answers)
    console = []

    def fake_input(prompt=""):
        try:
            answer = str(next(pending))
        except StopIteration:
            # main.py re-prompts on bad input, so stop here instead of looping forever
            raise RuntimeError(f"No answer left for prompt: {prompt!r}") from None
        console.append(f"{prompt}{answer}\n")
        return answer

    def fake_print(*args, sep=" ", end="\n", **_):
        console.append((" " if sep is None else sep).join(map(str, args)) + ("\n" if end is None else end))

    # skip the screen clear; create=True because the browser build of Python has no os.system
    with mock.patch.object(os, "system", return_value=0, create=True):
        scope = runpy.run_path(str(path), init_globals={"input": fake_input, "print": fake_print})

    return scope["payroll_list"], scope["grand_total"], "".join(console)
