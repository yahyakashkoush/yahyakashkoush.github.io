"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Container, Kicker, SectionHeading } from "@/components/primitives";
import { Magnetic, Reveal } from "@/components/motion";
import { usePortfolio } from "@/components/content-provider";
import { submitMessage, errorMessage } from "@/lib/cms";
import { cn } from "cn";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Contact() {
  const { content: { site, contact } } = usePortfolio();
  const [result, setResult] = useState("");
  const [submitError, setSubmitError] = useState("");
  const requestId = useRef<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setResult(""); setSubmitError("");
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
    try {
      requestId.current ||= crypto.randomUUID();
      await submitMessage({ id: requestId.current, kind: "contact", name, email, message, website: String(data.get("website") || "") });
      setResult(contact.successMessage); form.reset(); requestId.current = null;
    } catch (error) { setSubmitError(errorMessage(error)); } finally { setSending(false); }
  };

  return (
    <section id="contact" className="scroll-mt-24 pt-24 md:pt-32 lg:pt-40">
      <Container>
        <div className="grid grid-cols-1 gap-14 md:grid-cols-12 md:gap-10 lg:gap-16">
          <div className="md:col-span-7">
            <Reveal>
              <Kicker className="mb-5">{contact.label}</Kicker>
              <SectionHeading className="mb-8 max-w-[14ch]">{contact.title}</SectionHeading>
              <a
                href={`mailto:${site.email}`}
                className="link-wipe t-sub inline-block break-all text-fg-2 transition-colors duration-300 hover:text-red"
              >
                {site.email}
              </a>
            </Reveal>

            <Reveal delay={0.1}>
              <form onSubmit={onSubmit} noValidate className="mt-14 flex flex-col gap-8">
                <div aria-hidden="true" className="hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
                <Field id="name" label="Name" error={errors.name}>
                  <Input id="name" name="name" maxLength={120} autoComplete="name" placeholder="Your name" aria-invalid={!!errors.name} />
                </Field>

                <Field id="email" label="Email" error={errors.email}>
                  <Input
                    id="email"
                    name="email"
                    maxLength={254}
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
                    maxLength={12000}
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
                      {sending ? "Sending…" : contact.buttonLabel}
                    </button>
                  </Magnetic>
                  <p className="t-caption mt-4 max-w-[46ch]">
                    {contact.description}
                  </p>
                </div>
                {result && <p role="status" className="t-body text-foreground">{result}</p>}
                {submitError && <p role="alert" className="t-body text-red">{submitError}</p>}
              </form>
            </Reveal>
          </div>

          <Reveal delay={0.12} className="md:col-span-5">
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={contact.image.src}
                alt={contact.image.alt}
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
