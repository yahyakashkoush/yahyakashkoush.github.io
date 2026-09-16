/**
 * Single source of truth for identity + contact.
 *
 * Everything here is taken from _source/cv.txt. Two exceptions are flagged:
 *  - `email` is not present in cv.txt. Using the address the site owner
 *    supplied out of band. Replace if wrong.
 *  - `linkedin` is derived from the profile slug in the post URLs in cv.txt.
 * No GitHub profile URL exists in cv.txt, so none is listed.
 */

export const site = {
  name: "Yahya Kashkoush",
  role: "Applied AI & Automation Full-Stack Engineer",
  // Two-line hero statement. Drawn from the CV's own summary paragraph.
  statement: ["Applied AI", "and automation,", "built end to end."],
  intro:
    "I build AI products, SaaS platforms and automation systems from architecture through to production. Computer Science and AI graduate. Started in iOS, moved to applied AI in 2023.",
  email: "yahyaemad999@gmail.com",
  linkedin: "https://www.linkedin.com/in/yahya-kashkoush-268172221/",
  // The custom domain already wired to the GitHub Pages deployment (see
  // public/CNAME), not a guess — matches what was already live.
  url: "https://kashkoush.me",
} as const;

export const nav = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Experience", href: "/#experience" },
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Contact", href: "/#contact" },
  { label: "Start a project", href: "/start" },
] as const;
