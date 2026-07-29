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
10. Open the guided semantic HTML project from the completed lesson.
11. Submit the starter project and confirm the bounded review reports 2 of 6 checks.
12. Revise the project to pass all six checks, save the draft, and confirm the prior 2 of 6 review remains visible until resubmission.
13. Submit the revision and confirm the project reports a saved 6 of 6 result.
14. Return to `/dashboard` and confirm it shows 1 of 1 lessons, 100% progress, and the saved score.
15. Reload the project and dashboard, then confirm the exact project HTML, 6 of 6 review, session, and course completion persist.
16. Sign out and confirm the browser returns to the public homepage.
17. Visit the lesson and project URLs directly and confirm both redirect to sign in.
18. Call the project API while signed out and confirm it rejects access.
19. Sign back in with the same identity and confirm the completed lesson and exact project state remain.
20. Create a second disposable account and confirm it starts from the project template and cannot read or alter the first account's project.

## Expected analytics

Use one run marker for the full journey and confirm the capture sink receives this
ordered sequence:

1. `$pageview` on the public homepage
2. `account_created` after successful account creation
3. `lesson_started` when the unfinished lesson opens
4. `quiz_completed` after the passing score is saved

All four events must share one anonymous journey ID. The payload may include route
names, slugs, pass state, deployment environment, and the test run marker. It must
not include an email address, password, quiz answer, question text, lesson content,
or URL query string. Duplicate React renders must not create duplicate events.

## Pass condition

All buttons complete their intended action, the server-backed session survives a
reload, protected content redirects when signed out, and the quiz completion remains
visible on both the lesson and dashboard. The exact project HTML and bounded 6 of 6
review must recover for the original account while a second account stays isolated.
No console or failed-network errors may appear. The capture sink also contains
exactly one ordered four-event sequence for the run marker and one anonymous journey
ID, with no private content.
