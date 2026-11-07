import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Runs ONLY in a throwaway local PostgreSQL instance. Never reads DATABASE_URL.
test("reservation upgrade prevents races, protects private data, and releases slots", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "portfolio-booking-test-"));
  const dataDir = join(root, "data");
  const env = { ...process.env, PGHOST: root, PGPORT: "55439", PGDATABASE: "postgres", PGUSER: process.env.USER || "runner" };
  let started = false;
  const sql = (query) => execFileSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-At"], { env, input: query, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  const parallelSql = (query) => new Promise((resolve) => {
    const child = spawn("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-At"], { env, stdio: ["pipe", "pipe", "pipe"] });
    let output = "", error = "";
    child.stdout.on("data", (data) => { output += data; });
    child.stderr.on("data", (data) => { error += data; });
    child.on("close", (code) => resolve({ code, output, error }));
    child.stdin.end(query);
  });
  const details = (days, time) => `jsonb_build_object('preferredDate', ((now() at time zone 'Africa/Cairo')::date + ${days})::text, 'preferredTime', '${time}', 'budget', 'EGP 1000', 'timeZone', 'Africa/Cairo')`;
  const reserve = (id, days, time, key = id) => `select public.accept_portfolio_message('${key}', '${id}', 'project', 'Test', 'test@example.test', 'A booking concurrency test.', ${details(days, time)});`;
  try {
    execFileSync("initdb", ["-D", dataDir, "--auth=trust", "--no-locale", "--encoding=UTF8"], { stdio: "pipe" });
    execFileSync("pg_ctl", ["-D", dataDir, "-l", join(root, "server.log"), "-o", `-F -h '' -k ${root} -p 55439`, "-w", "start"], { stdio: "pipe" });
    started = true;
    sql(`
      create role anon nologin; create role authenticated nologin; create role service_role nologin;
      create function public.is_portfolio_admin() returns boolean language sql stable as
        $$ select coalesce(current_setting('test.admin', true), 'false') = 'true' $$;
      create table public.portfolio_content(id text primary key, content jsonb);
      create table public.portfolio_messages(id uuid primary key, kind text, name text, email text, message text,
        details jsonb, status text default 'new', created_at timestamptz default now(), updated_at timestamptz default now());
      create table public.portfolio_submission_limits(key text primary key, window_start timestamptz, count integer);
      insert into public.portfolio_content values ('published', '{"start":{"scheduling":{"timeZone":"Africa/Cairo","leadTimeDays":1,"horizonDays":21,"weekdays":[0,1,2,3,4,5,6],"slots":["09:00","09:15","09:30","10:00"]}}}');
      grant usage on schema public to anon, authenticated, service_role;
    `);
    // Simulate existing duplicate requests before upgrading: first wins, second is flagged.
    sql(`insert into public.portfolio_messages(id,kind,details,created_at) values
      ('00000000-0000-4000-8000-000000000001','project',${details(6, "10:00")},now()-interval '2 hours'),
      ('00000000-0000-4000-8000-000000000002','project',${details(6, "10:00")},now()-interval '1 hour');`);
    sql(readFileSync(new URL("../supabase/migrations/20261107_booking_reservations.sql", import.meta.url), "utf8"));
    await t.test("historical conflicts are preserved and flagged, not deleted", () => {
      assert.equal(sql("select count(*) from portfolio_messages;"), "2");
      assert.equal(sql("select count(*) from portfolio_bookings;"), "1");
      assert.match(sql("select details->>'meetingStatus' from portfolio_messages where id='00000000-0000-4000-8000-000000000002';"), /Conflict/);
    });
    const id = "10000000-0000-4000-8000-000000000001";
    await t.test("a retry is idempotent, but another visitor cannot take the interval", () => {
      assert.equal(sql(reserve(id, 2, "09:00")), id);
      assert.equal(sql(reserve(id, 2, "09:00")), id);
      assert.throws(() => sql(reserve("10000000-0000-4000-8000-000000000002", 2, "09:00")), /conflicting key|exclusion/i);
      assert.throws(() => sql(reserve("10000000-0000-4000-8000-000000000003", 2, "09:15")), /conflicting key|exclusion/i);
      assert.equal(sql("select count(*) from portfolio_messages where id::text like '10000000%';"), "1");
      assert.equal(sql("select count from portfolio_submission_limits where key='10000000-0000-4000-8000-000000000001';"), "1");
      assert.equal(sql(reserve("10000000-0000-4000-8000-000000000004", 2, "09:30")), "10000000-0000-4000-8000-000000000004");
    });
    await t.test("simultaneous transactions accept exactly one reservation and one message", async () => {
      const results = await Promise.all([
        parallelSql(`begin; ${reserve("20000000-0000-4000-8000-000000000001", 3, "10:00")} select pg_sleep(0.2); commit;`),
        parallelSql(`begin; ${reserve("20000000-0000-4000-8000-000000000002", 3, "10:00")} select pg_sleep(0.2); commit;`),
      ]);
      assert.equal(results.filter((result) => result.code === 0).length, 1, JSON.stringify(results));
      assert.equal(sql("select count(*) from portfolio_messages where id::text like '20000000%';"), "1");
      assert.equal(sql("select count(*) from portfolio_bookings where message_id::text like '20000000%';"), "1");
    });
    await t.test("public availability exposes no private details and marks overlapping slots", () => {
      const availability = JSON.parse(sql("set role anon; select public.get_portfolio_booking_availability();").split("\n").at(-1));
      assert.equal(availability.timeZone, "Africa/Cairo");
      assert.doesNotMatch(JSON.stringify(availability), /example|message_id|Test|email/);
      assert.ok(Object.values(availability.bookedByDate).some((slots) => slots.includes("09:00") && slots.includes("09:15")));
      assert.throws(() => sql("set role anon; select * from public.portfolio_bookings;"), /permission denied/);
    });
    await t.test("administrator-only confirmation, blocking and release share the same availability", () => {
      const booking = sql(`select id from portfolio_bookings where message_id='${id}';`);
      assert.throws(() => sql(`set role authenticated; select manage_portfolio_booking('${booking}','confirmed');`), /Administrator access/);
      sql(`set role authenticated; set test.admin='true'; select manage_portfolio_booking('${booking}','confirmed');`);
      assert.equal(sql(`select status from portfolio_bookings where id='${booking}';`), "confirmed");
      assert.equal(sql("set role authenticated; select count(*) from portfolio_bookings;").split("\n").at(-1), "0");
      sql(`set role authenticated; set test.admin='true'; select manage_portfolio_booking('${booking}','cancelled');`);
      assert.throws(() => sql(reserve(id, 2, "09:00")), /no active reservation/);
      assert.equal(sql(reserve("30000000-0000-4000-8000-000000000001", 2, "09:00")), "30000000-0000-4000-8000-000000000001");
      sql("set role authenticated; set test.admin='true'; select block_portfolio_time((now() at time zone 'Africa/Cairo')::date+4, '10:00');");
      assert.throws(() => sql(reserve("30000000-0000-4000-8000-000000000002", 4, "10:00")), /conflicting key|exclusion/i);
    });
  } finally {
    if (started) execFileSync("pg_ctl", ["-D", dataDir, "-m", "immediate", "-w", "stop"], { stdio: "pipe" });
    rmSync(root, { recursive: true, force: true });
  }
});
