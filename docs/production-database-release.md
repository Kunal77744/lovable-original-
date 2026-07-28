# Production database release

Use this runbook only after a named database owner has access to the production
PostgreSQL connection. Keep the application deployment paused until every check
below passes.

## Release boundary

This release applies the nine committed migrations in journal order:

1. `0000_stiff_invisible_woman.sql`
2. `0001_oval_eddie_brock.sql`
3. `0002_green_kat_farrell.sql`
4. `0003_messy_abomination.sql`
5. `0004_ancient_mattie_franklin.sql`
6. `0005_fearless_the_hunter.sql`
7. `0006_kind_scream.sql`
8. `0007_tense_colleen_wing.sql`
9. `0008_panoramic_mysterio.sql`

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
after verifying nine migration records and all seventeen required application tables.
The command never prints the connection string.

## Required result

The successful command ends with:

```text
Database release ready: 9 required migrations verified (9 recorded total) and 17 required tables verified.
```

If any other result appears, keep deployment paused. The database owner should
inspect provider logs, restore the pre-release snapshot if needed, or prepare a
reviewed forward migration. Do not drop production tables or edit the migration
journal by hand.

## Post-migration release checks

Before merging or deploying, run the automated learner release gate against a
loopback URL. Give it a PostgreSQL connection whose role may create and drop
databases. The command creates a uniquely named database, migrates it, builds and
starts the app, runs the complete journey, stops the app, and drops the database:

```sh
LEARNER_GATE_DATABASE_URL="$ISOLATED_POSTGRES_ADMIN_URL" \
  npm run release:learner-gate -- --app-url http://127.0.0.1:3210
```

The command prints one `PASS` line for each of ten checks and succeeds only
after account creation, lesson completion, saved `1/1` progress, sign-out,
protected-route redirect, restored progress after sign-in, certificate recovery,
and cross-account isolation all pass. It never prints the database URL,
generated account email, password, auth secret, session token, or database name.
It accepts loopback HTTP URLs only, so it cannot point at production or a hosted
preview.

After the automated result reads `Learner release gate passed: 10/10 checks.`:

1. Confirm the production migration command produced the required result above.
2. Deploy the reviewed application release.
3. Repeat the account-to-saved-result journey once in production.
4. Confirm the ordered analytics path is readable as `$pageview`,
   `account_created`, `lesson_started`, and `quiz_completed`, with no private
   fields.
