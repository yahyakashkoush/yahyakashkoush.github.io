import { useEffect, useState } from "react";
import { ArrowClockwise, CalendarCheck, X } from "@phosphor-icons/react";
import { blockTime, changeBooking, readBookings, type AdminBooking } from "@/lib/admin-bookings";
import { bookingService } from "@/lib/booking";
import { errorMessage } from "@/lib/cms";
import styles from "./cms.module.css";

/** Administrators manage the same database reservations used by the public form. */
export function BookingManager() {
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [zone, setZone] = useState("");
  const [history, setHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let live = true;
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const [bookings, availability] = await Promise.all([readBookings(history), bookingService.getAvailability()]);
        if (live) { setItems(bookings); setZone(availability?.timeZone || ""); setError(""); }
      } catch (error) {
        if (live) setError(`Bookings could not be loaded. ${errorMessage(error)} Check that the booking upgrade is active.`);
      } finally {
        inFlight = false;
        if (live) setLoading(false);
      }
    };
    setLoading(true);
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 30000);
    window.addEventListener("focus", load);
    return () => { live = false; window.clearInterval(timer); window.removeEventListener("focus", load); };
  }, [history, refresh]);

  const run = async (action: () => Promise<void>, success: string) => {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await action();
      setNotice(success);
      setRefresh((key) => key + 1);
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  };

  const format = (value: string) => new Date(value).toLocaleString(undefined, {
    timeZone: zone || "Africa/Cairo", weekday: "short", day: "numeric", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={styles.bookingLayout}>
      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <h2><CalendarCheck size={20} /> Appointments</h2>
          <button className={styles.button} disabled={busy || loading} onClick={() => setRefresh((key) => key + 1)}><ArrowClockwise size={15} />Refresh</button>
        </div>
        <p className={styles.hint}>Times use {zone || "the published scheduling timezone"}. Requested appointments already hold their time. Confirmation does not send an email automatically.</p>
        <div className={styles.filterTabs}>
          <button aria-pressed={!history} className={!history ? styles.selected : ""} onClick={() => setHistory(false)}>Upcoming & blocked</button>
          <button aria-pressed={history} className={history ? styles.selected : ""} onClick={() => setHistory(true)}>All appointments</button>
        </div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {notice && <p role="status" className={styles.notice}>{notice}</p>}
        {loading ? <p role="status" className={styles.hint}>Loading live reservations…</p> : !items.length && !error ? (
          <div className={styles.empty}><CalendarCheck size={28} /><h3>No appointments here yet.</h3><p>Accepted project briefs will appear automatically.</p></div>
        ) : (
          <ul className={styles.bookingList}>
            {items.map((item) => (
              <li key={item.id}>
                <div className={styles.bookingHeading}>
                  <strong>{format(item.starts_at)}</strong>
                  <span className={styles.bookingStatus} data-status={item.status}>{item.status}</span>
                </div>
                <p>{item.portfolio_messages?.name || "Blocked time"}</p>
                {item.portfolio_messages?.email && <a className={styles.bookingEmail} href={`mailto:${item.portfolio_messages.email}`}>{item.portfolio_messages.email}</a>}
                <p className={styles.hint}>30 minutes · {zone}</p>
                {item.status !== "cancelled" && (
                  <div className={styles.toolbar}>
                    {item.status === "requested" && <button disabled={busy} className={styles.primary} onClick={() => void run(() => changeBooking(item.id, "confirmed"), "Appointment confirmed. Contact the visitor with meeting details.")}>Confirm appointment</button>}
                    {item.portfolio_messages?.email && <a className={styles.button} href={`mailto:${item.portfolio_messages.email}?subject=${encodeURIComponent("Your project meeting")}`}>Email visitor</a>}
                    <button disabled={busy} className={styles.button} onClick={() => {
                      if (window.confirm("Release this appointment? The time will immediately become available to other visitors. No cancellation email is sent automatically.")) {
                        void run(() => changeBooking(item.id, "cancelled"), "Time released. Visitors can now request it.");
                      }
                    }}><X size={14} />{item.status === "blocked" ? "Unblock time" : "Release time"}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className={styles.hint}>Up to 200 appointments shown. Automatically refreshes every 30 seconds. Archiving a message does not release its appointment.</p>
      </section>
      <section className={styles.panel}>
        <h2>Keep time unavailable</h2>
        <p className={styles.hint}>Block a 30-minute interval for your own schedule. Visitors will see overlapping times marked ×.</p>
        <form onSubmit={(event) => { event.preventDefault(); void run(() => blockTime(date, time), "Time blocked. It is no longer available to visitors."); }}>
          <label className={styles.field}>Date<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label className={styles.field}>Time · {zone || "published timezone"}<input type="time" required step={900} value={time} onChange={(event) => setTime(event.target.value)} /></label>
          <button className={styles.primary} disabled={busy || loading || !zone}>{busy ? "Saving…" : "Block this time"}</button>
        </form>
      </section>
    </div>
  );
}
