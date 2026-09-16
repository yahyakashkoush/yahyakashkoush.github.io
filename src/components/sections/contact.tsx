"use client";

import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Container, Kicker, SectionHeading } from "@/components/primitives";
import { Magnetic, Reveal } from "@/components/motion";
import { site } from "@/content/site";
import { cn } from "cn";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * There is no server behind this site, so the form composes a mail draft
 * rather than pretending to submit. Validation is real; the send is a handoff
 * to the visitor's own mail client, and the address is always visible as a
 * direct fallback.
 */
export function Contact() {
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const next: Errors = {};
    if (!name) next.name = "Required";
    if (!email) next.email = "Required";
    else if (!EMAIL.test(email)) next.email = "Enter a valid email address";
    if (!message) next.message = "Required";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    const subject = encodeURIComponent(`Enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
    window.setTimeout(() => setSending(false), 1200);
  };

  return (
    <section id="contact" className="scroll-mt-24 pt-24 md:pt-32 lg:pt-40">
      <Container>
        <div className="grid grid-cols-1 gap-14 md:grid-cols-12 md:gap-10 lg:gap-16">
          <div className="md:col-span-7">
            <Reveal>
              <Kicker className="mb-5">Contact</Kicker>
              <SectionHeading className="mb-8 max-w-[14ch]">Let&rsquo;s build something.</SectionHeading>
              <a
                href={`mailto:${site.email}`}
                className="link-wipe t-sub inline-block break-all text-fg-2 transition-colors duration-300 hover:text-red"
              >
                {site.email}
              </a>
            </Reveal>

            <Reveal delay={0.1}>
              <form onSubmit={onSubmit} noValidate className="mt-14 flex flex-col gap-8">
                <Field id="name" label="Name" error={errors.name}>
                  <Input id="name" name="name" autoComplete="name" placeholder="Your name" aria-invalid={!!errors.name} />
                </Field>

                <Field id="email" label="Email" error={errors.email}>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    aria-invalid={!!errors.email}
                  />
                </Field>

                <Field id="message" label="Message" error={errors.message}>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="What are you building?"
                    aria-invalid={!!errors.message}
                  />
                </Field>

                <div>
                  <Magnetic>
                    <button
                      type="submit"
                      disabled={sending}
                      className={cn(
                        "t-nav inline-flex min-h-12 items-center justify-center border border-foreground px-7 text-foreground",
                        "transition-[background-color,color,border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        "hover:border-red hover:bg-red hover:text-white active:translate-y-px",
                        "disabled:pointer-events-none disabled:opacity-40",
                      )}
                    >
                      {sending ? "Opening mail" : "Send message"}
                    </button>
                  </Magnetic>
                  <p className="t-caption mt-4 max-w-[46ch]">
                    This opens a draft in your own mail client. Nothing is sent from this page.
                  </p>
                </div>
              </form>
            </Reveal>
          </div>

          <Reveal delay={0.12} className="md:col-span-5">
            <div className="relative aspect-[3/4] w-full">
              <Image
                src="/media/portrait/full-body.jpg"
                alt="Full-length portrait inside a red light frame"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover object-center"
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="t-label text-fg-3">
        {label}
      </label>
      {children}
      {error && (
        <span role="alert" className="t-meta text-red">
          {error}
        </span>
      )}
    </div>
  );
}
