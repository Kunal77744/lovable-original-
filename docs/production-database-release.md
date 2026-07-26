# Production database release

Use this runbook only after a named database owner has access to the production
PostgreSQL connection. Keep the application deployment paused until every check
below passes.

## Release boundary

This release applies the four committed migrations in journal order:

1. `0000_stiff_invisible_woman.sql`
2. `0001_oval_eddie_brock.sql`
3. `0002_green_kat_farrell.sql`
4. `0003_messy_abomination.sql`

Drizzle records each completed migration in
`drizzle.__drizzle_migrations`. The migration statements run in a transaction,
so a failed migration does not authorize an application deployment.

## Production steps

1. Take a provider snapshot or confirm a current backup and record the owner.
2. Check out the exact reviewed release commit and run `npm ci`.
3. Load `DATABASE_URL` from the production secret manager into the current
   shell. Do not paste it into source files, tickets, chat, or command output.
4. Confirm `BETTER_AUTH_SECRET` is set to the production secret and
   `BETTER_AUTH_URL` is `https://lovable-original-eight.vercel.app`.
5. Run the single release command:

   ```sh
   npm run db:migrate
   ```

The command first validates the connection URL and runs `select 1`. A missing,
malformed, unreachable, or rejected connection exits before any migration is
attempted. It then applies the migration journal and exits successfully only
after verifying four migration records and all ten required application tables.
The command never prints the connection string.

## Required result

The successful command ends with:

```text
Database release ready: 4 migrations recorded and 10 required tables verified.
```

If any other result appears, keep deployment paused. The database owner should
inspect provider logs, restore the pre-release snapshot if needed, or prepare a
reviewed forward migration. Do not drop production tables or edit the migration
journal by hand.

## Post-migration release checks

1. Confirm the migration command produced the required result above.
2. Deploy the reviewed application release.
3. Create one fresh production test account.
4. Open the protected dashboard and start the Web Development Foundations
   lesson.
5. Complete the four-question quiz with at least 75%.
6. Return to the dashboard and confirm progress remains `1/1` with the saved
   best score after a page reload and a new sign-in.
7. Confirm the ordered analytics path is readable as `$pageview`,
   `account_created`, `lesson_started`, and `quiz_completed`, with no private
   fields.
