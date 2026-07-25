# Student account journey

## Product under test

- Lovable Original
- Local route: `http://127.0.0.1:3000/account`
- Production route: `https://lovable-original-eight.vercel.app/account`

## Journey

1. Open the public homepage and use the student sign-in link.
2. Create an account with a fresh disposable test identity.
3. Confirm the browser lands on `/dashboard`.
4. Confirm the dashboard shows the signed-in email and one first-course entry.
5. Reload `/dashboard` and confirm the session persists.
6. Sign out and confirm the browser returns to the public homepage.
7. Visit `/dashboard` directly and confirm the browser redirects to sign in.
8. Sign back in with the same identity and confirm the dashboard returns.

## Expected analytics

No auth analytics events are instrumented in this task. The scheduled learning-loop
instrumentation task owns product event capture after the first lesson path exists.

## Pass condition

All buttons complete their intended action, the server-backed session survives a
reload, protected content redirects when signed out, and the first-course result is
visible without console or failed-network errors.
