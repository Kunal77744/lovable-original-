# First student learning journey

## Product under test

- Lovable Original
- Local entry: `http://127.0.0.1:3000/account`
- Production entry: `https://lovable-original-eight.vercel.app/account`

## Journey

1. Open the public homepage and use the student sign-in link.
2. Create an account with a fresh disposable test identity.
3. Confirm the browser lands on `/dashboard`.
4. Confirm the dashboard shows Web Development Foundations at 0 of 1 lessons.
5. Open “Build a page the browser understands.”
6. Confirm the lesson includes three numbered teaching sections and four quiz questions.
7. Submit an incomplete quiz and confirm the inline validation asks for every answer.
8. Submit fewer than three correct answers and confirm the score is saved without completion.
9. Submit at least three correct answers and confirm the lesson-complete state appears.
10. Return to `/dashboard` and confirm it shows 1 of 1 lessons, 100% progress, and the saved score.
11. Reload `/dashboard` and confirm the session and completion persist.
12. Sign out and confirm the browser returns to the public homepage.
13. Visit the lesson URL directly and confirm the browser redirects to sign in.
14. Sign back in with the same identity and confirm the completed state remains.

## Expected analytics

No auth analytics events are instrumented in this task. The scheduled learning-loop
instrumentation task owns product event capture after the first lesson path exists.

## Pass condition

All buttons complete their intended action, the server-backed session survives a
reload, protected content redirects when signed out, and the quiz completion remains
visible on both the lesson and dashboard without console or failed-network errors.
