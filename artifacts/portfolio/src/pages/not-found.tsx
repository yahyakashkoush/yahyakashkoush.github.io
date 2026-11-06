import { Action, Container, Kicker } from "@/components/primitives";
import { usePageTitle } from "@/lib/compat/title";

export default function NotFound() {
  usePageTitle("Not found");
  return (
    <section className="flex min-h-[100dvh] items-center">
      <Container>
        <Kicker className="mb-6 text-red">404</Kicker>
        <h1 className="t-display max-w-[14ch] text-foreground">Nothing here.</h1>
        <p className="t-body mt-6 max-w-[42ch]">That page does not exist, or it has moved.</p>
        <div className="mt-10">
          <Action href="/">Back to start</Action>
        </div>
      </Container>
    </section>
  );
}
