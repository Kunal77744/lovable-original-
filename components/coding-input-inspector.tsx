type CodingInputInspectorProps = {
  input: string;
};

export type CodingInputAnatomy = {
  rawLiteral: string;
  lines: string[];
  tokens: string[];
};

export function getCodingInputAnatomy(input: string): CodingInputAnatomy {
  const normalizedInput = input.replace(/\r\n?/g, "\n");

  return {
    rawLiteral: JSON.stringify(normalizedInput),
    lines: normalizedInput.split("\n"),
    tokens: normalizedInput.trim().length
      ? normalizedInput.trim().split(/\s+/)
      : [],
  };
}

export function CodingInputInspector({ input }: CodingInputInspectorProps) {
  const anatomy = getCodingInputAnatomy(input);
  const lineLabel = anatomy.lines.length === 1 ? "line" : "lines";
  const tokenLabel = anatomy.tokens.length === 1 ? "token" : "tokens";

  return (
    <details className="coding-input-inspector">
      <summary>
        <span>Inspect how this input arrives</span>
        <small>
          {anatomy.lines.length} {lineLabel} · {anatomy.tokens.length} {tokenLabel}
        </small>
      </summary>

      <div className="coding-input-inspector-body">
        <header>
          <p className="eyebrow">Example input map</p>
          <h3>From one string to usable values.</h3>
          <p>
            <code>solve(input)</code> receives one text string. Split it only in
            the way this problem needs.
          </p>
        </header>

        <div className="coding-input-flow">
          <section aria-labelledby="coding-input-raw-title">
            <span aria-hidden="true">1</span>
            <div>
              <h4 id="coding-input-raw-title">Raw string</h4>
              <pre>{anatomy.rawLiteral}</pre>
            </div>
          </section>

          <span className="coding-input-flow-arrow" aria-hidden="true">
            ↓
          </span>

          <section aria-labelledby="coding-input-lines-title">
            <span aria-hidden="true">2</span>
            <div>
              <h4 id="coding-input-lines-title">Numbered lines</h4>
              <ol>
                {anatomy.lines.map((line, index) => (
                  <li key={`${index}-${line}`}>
                    <code>{line || "(blank line)"}</code>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <span className="coding-input-flow-arrow" aria-hidden="true">
            ↓
          </span>

          <section aria-labelledby="coding-input-tokens-title">
            <span aria-hidden="true">3</span>
            <div>
              <h4 id="coding-input-tokens-title">Whitespace tokens</h4>
              {anatomy.tokens.length ? (
                <ol>
                  {anatomy.tokens.map((token, index) => (
                    <li key={`${index}-${token}`}>
                      <code>{token}</code>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No non-empty tokens.</p>
              )}
            </div>
          </section>
        </div>

        <p className="coding-input-inspector-note">
          Whitespace splitting treats spaces and line breaks as separators.
          Punctuation stays attached to its token.
        </p>
      </div>
    </details>
  );
}
