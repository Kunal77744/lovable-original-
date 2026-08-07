export function CssBoxModelLessonContent() {
  return (
    <>
      <section className="lesson-section" id="lesson-idea">
        <p className="lesson-section-number">01</p>
        <div>
          <h2>A selector is a precise instruction.</h2>
          <p>
            CSS starts by choosing which elements receive a rule. A class selector
            begins with a dot, so <code>.learning-card</code> targets every element
            carrying <code>class=&quot;learning-card&quot;</code>.
          </p>
          <pre aria-label="A class selector for a learning card">
            <code>{`.learning-card {
  color: #17231e;
  background: #ffffff;
}`}</code>
          </pre>
          <div className="selector-trace" aria-label="How a CSS selector matches HTML">
            <span>.learning-card</span>
            <span aria-hidden="true">matches</span>
            <span>&lt;article class=&quot;learning-card&quot;&gt;</span>
          </div>
        </div>
      </section>

      <section className="lesson-section">
        <p className="lesson-section-number">02</p>
        <div>
          <h2>Combine selectors to keep a rule local.</h2>
          <p>
            A space means “inside.” The selector <code>.learning-card strong</code>{" "}
            reaches <code>&lt;strong&gt;</code> elements inside the card without
            changing every strong element on the page.
          </p>
          <pre aria-label="A descendant selector scoped to the learning card">
            <code>{`.learning-card strong {
  color: #175437;
}`}</code>
          </pre>
          <div className="lesson-note">
            <strong>Read selectors from right to left</strong>
            <p>
              Find a <code>&lt;strong&gt;</code> element, then check whether it sits
              inside <code>.learning-card</code>. This habit makes longer selectors
              easier to reason about.
            </p>
          </div>
        </div>
      </section>

      <section className="lesson-section">
        <p className="lesson-section-number">03</p>
        <div>
          <h2>The box model explains the space you see.</h2>
          <p>
            Every element has content, padding, border, and margin. Padding creates
            space inside the edge. Margin separates the whole box from its
            neighbours.
          </p>
          <div className="box-model-diagram" aria-label="CSS box model from margin to content">
            <div className="box-model-margin">
              <span>margin</span>
              <div className="box-model-border">
                <span>border</span>
                <div className="box-model-padding">
                  <span>padding</span>
                  <div className="box-model-content">content · 280px card</div>
                </div>
              </div>
            </div>
          </div>
          <p>
            By default, a declared width covers only the content. Add{" "}
            <code>box-sizing: border-box</code> when the padding and border should
            stay inside that width.
          </p>
          <div className="lesson-practice">
            <p className="quiz-kicker">Five-minute practice</p>
            <h3>Make the card predictable before making it pretty.</h3>
            <p>
              Complete the saved CSS block below. The checks look for two scoped
              selectors and the box-model choices that keep the card at 280px.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
