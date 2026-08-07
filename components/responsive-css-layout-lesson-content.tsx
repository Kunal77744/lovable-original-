export function ResponsiveCssLayoutLessonContent() {
  return (
    <>
      <section className="lesson-section" id="lesson-idea">
        <p className="lesson-section-number">01</p>
        <div>
          <h2>Layout describes a relationship, not a screen size.</h2>
          <p>
            A responsive layout keeps its meaning as space changes. Instead of
            choosing a fixed number of columns, describe the smallest useful
            card and let the browser decide how many fit.
          </p>
          <pre aria-label="A resource grid container">
            <code>{`.resource-grid {
  display: grid;
}`}</code>
          </pre>
          <div
            className="selector-trace"
            aria-label="How a grid container arranges cards"
          >
            <span>.resource-grid</span>
            <span aria-hidden="true">arranges</span>
            <span>every direct resource card</span>
          </div>
        </div>
      </section>

      <section className="lesson-section">
        <p className="lesson-section-number">02</p>
        <div>
          <h2>Give every column a safe minimum and a flexible maximum.</h2>
          <p>
            <code>minmax(14rem, 1fr)</code> protects readability at the narrow
            end and shares spare space at the wide end. <code>1fr</code> means
            one fraction of the available row.
          </p>
          <pre aria-label="Flexible grid columns">
            <code>{`.resource-grid {
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
}`}</code>
          </pre>
          <div className="lesson-note">
            <strong>Why auto-fit matters</strong>
            <p>
              The browser adds or removes tracks as the container changes. The
              layout responds to its actual space without a device list.
            </p>
          </div>
        </div>
      </section>

      <section className="lesson-section">
        <p className="lesson-section-number">03</p>
        <div>
          <h2>Use gap for the relationship between cards.</h2>
          <p>
            A grid <code>gap</code> belongs to the container, so every row and
            column uses one spacing rule. <code>min-width: 0</code> lets long
            card content shrink instead of forcing the track wider.
          </p>
          <pre aria-label="Grid spacing and shrinkable cards">
            <code>{`.resource-grid {
  gap: 1rem;
}

.resource-card {
  min-width: 0;
}`}</code>
          </pre>
          <div className="lesson-practice">
            <p className="quiz-kicker">Five-minute practice</p>
            <h3>Make three cards adapt without a breakpoint.</h3>
            <p>
              Finish the saved CSS below. Resize the page and watch the same
              rule move from one column to several without hiding content.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
