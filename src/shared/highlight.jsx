// Just enough Python highlighting to make main.py readable on a projector.
const TOKEN = /(f?"[^"\n]*"|f?'[^'\n]*')|\b(import|def|while|True|try|return|except|for|in|if|elif|break|and|range)\b|\b(\d+(?:\.\d+)?)\b/g;

export function highlight(line) {
  const out = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const cls = m[1] ? "tok-str" : m[2] ? "tok-kw" : "tok-num";
    out.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}
