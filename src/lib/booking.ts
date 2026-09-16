import { site } from "@/content/site";
import {
  budgetLabel,
  formatLongDate,
  formatTime,
  resolvedTimeZone,
  typeLabels,
  type ProjectInquiry,
} from "@/lib/inquiry";

/**
 * The seam between the brief and whoever actually books the meeting.
 *
 * The site has no backend — the existing contact form hands off to the
 * visitor's mail client — so the shipped provider is a handoff, and it says so.
 * It reports `requested`, never `confirmed`, because nothing has confirmed
 * anything: the visitor picked a preferred slot and sent it. The UI keys its
 * final copy off that status, so wiring a real provider later is the only
 * change needed to start claiming a booking.
 */

export type BookingOutcome =
  /** A provider held the slot. Only this status may be shown as booked. */
  | { status: "confirmed"; reference: string; when: string }
  /** Brief delivered, meeting time still a request awaiting a human reply. */
  | { status: "requested"; via: "mail" }
  | { status: "failed"; reason: string };

/** A provider that publishes real availability returns one of these. */
export type Availability = {
  /** ISO dates that can actually be booked. */
  dates: string[];
  /** 24h times per ISO date. */
  slotsByDate: Record<string, string[]>;
};

export interface BookingProvider {
  readonly id: string;
  /** Whether the final screen is allowed to say a meeting is booked. */
  readonly confirmsBookings: boolean;
  /**
   * Real open slots, or null when the provider cannot publish any. Null means
   * the UI must present its grid as preferred times rather than free ones.
   */
  getAvailability(): Promise<Availability | null>;
  submit(inquiry: ProjectInquiry): Promise<BookingOutcome>;
}

/* Transcript -------------------------------------------------------------- */

/** The brief as plain text. Shared by every provider and the mail handoff. */
export function inquiryTranscript(v: ProjectInquiry, locale?: string): string {
  const lines = [
    "PROJECT BRIEF",
    "",
    "PROJECT",
    v.projectBrief.trim(),
    "",
    "TYPE",
    typeLabels(v.projectTypes),
    "",
    "INVESTMENT",
    budgetLabel(v.budget),
    "",
    "CONTACT",
    v.name.trim(),
    v.email.trim(),
  ];
  if (v.company.trim()) lines.push(v.company.trim());
  if (v.date && v.time) {
    lines.push(
      "",
      "PREFERRED MEETING",
      `${formatLongDate(v.date, locale)} at ${formatTime(v.time, locale)} (${resolvedTimeZone()})`,
      "",
      "This time is a request, not a confirmed booking.",
    );
  }
  return lines.join("\n");
}

/* Mail handoff ------------------------------------------------------------ */

const MAILTO_LIMIT = 1800;

/**
 * No server, so the brief is handed to the visitor's own mail client exactly
 * as the site's contact form already does. Nothing is transmitted from the
 * page, and the address stays visible as a fallback.
 */
export const mailHandoffProvider: BookingProvider = {
  id: "mail-handoff",
  confirmsBookings: false,

  async getAvailability() {
    return null;
  },

  async submit(v) {
    const subject = `Project brief — ${v.name.trim() || "New inquiry"}`;
    const body = inquiryTranscript(v);
    const href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (href.length > MAILTO_LIMIT) {
      // Some clients silently truncate very long mailto URLs, which would drop
      // the end of the brief without telling anyone.
      const short = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `${body.slice(0, 900)}\n\n[Brief continues — the full text is on the sender's screen.]`,
      )}`;
      window.location.href = short;
      return { status: "requested", via: "mail" };
    }

    window.location.href = href;
    return { status: "requested", via: "mail" };
  },
};

/**
 * Swap this for a real adapter when a calendar is connected. Everything the UI
 * needs is behind the interface above, so no component has to change.
 */
export const bookingService: BookingProvider = mailHandoffProvider;
