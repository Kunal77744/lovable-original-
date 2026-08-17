export function AccessibleFormsLessonContent() {
  return (
    <>
      <section className="lesson-section" id="lesson-idea">
        <p className="lesson-section-number">01</p>
        <div>
          <h2>A label gives every field a name.</h2>
          <p>
            Placeholder text disappears as soon as someone types. A visible
            <code> &lt;label&gt;</code> stays available, and matching its
            <code> for</code> value to the input&apos;s <code>id</code> lets a
            click on the label move focus to the field.
          </p>
          <pre aria-label="A labelled email field">
            <code>{`<label for="email">Email address</label>
<input id="email" name="email" type="email" />`}</code>
          </pre>
          <div className="selector-trace" aria-label="How a form label connects to its input">
            <span>for=&quot;email&quot;</span>
            <span aria-hidden="true">connects to</span>
            <span>id=&quot;email&quot;</span>
          </div>
        </div>
      </section>

      <section className="lesson-section" id="lesson-section-2">
        <p className="lesson-section-number">02</p>
        <div>
          <h2>Instructions belong to the field they explain.</h2>
          <p>
            Use the most specific input type available. Then connect longer help
            text with <code>aria-describedby</code> so it is announced with the
            field instead of becoming disconnected page copy.
          </p>
          <pre aria-label="An email field connected to help text">
            <code>{`<p id="email-help">We will send one reminder.</p>
<input
  id="email"
  name="email"
  type="email"
  aria-describedby="email-help"
/>`}</code>
          </pre>
          <div className="lesson-note">
            <strong>Use native HTML first</strong>
            <p>
              <code>type=&quot;email&quot;</code> gives browsers useful validation and
              mobile keyboards without custom JavaScript.
            </p>
          </div>
        </div>
      </section>

      <section className="lesson-section" id="lesson-section-3">
        <p className="lesson-section-number">03</p>
        <div>
          <h2>Related choices need one shared question.</h2>
          <p>
            A <code>&lt;fieldset&gt;</code> groups related controls. Its
            <code> &lt;legend&gt;</code> names the group, while radio buttons that
            share one <code>name</code> expose one choice instead of unrelated
            toggles.
          </p>
          <pre aria-label="A labelled radio group">
            <code>{`<fieldset>
  <legend>Choose a workshop time</legend>
  <label><input type="radio" name="time" value="morning" /> Morning</label>
  <label><input type="radio" name="time" value="evening" /> Evening</label>
</fieldset>`}</code>
          </pre>
          <div className="lesson-practice">
            <p className="quiz-kicker">Five-minute practice</p>
            <h3>Make a workshop form understandable without guessing.</h3>
            <p>
              Complete the saved HTML below. The server checks the label, email
              instructions, radio group, and explicit submit action.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
