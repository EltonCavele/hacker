"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "reicon-react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import { setDevicePasskey, usePasskeySupport } from "../hooks/use-passkey-support";

const OTP_LENGTH = 6;
const slotClassName =
  "h-14 w-auto min-w-0 flex-1 rounded-2xl text-xl first:rounded-2xl last:rounded-2xl sm:h-16 sm:w-14 sm:flex-none";
const emailSchema = z.email();

/** Animates height + opacity between hidden and shown; hidden content is inert (no focus, no a11y tree). */
function Reveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="-m-1 min-h-0 overflow-hidden p-1">{children}</div>
    </div>
  );
}

/** `children` are the alternative sign-in methods; they are hidden once the email looks valid. */
export function EmailOtpSignIn({ header, children }: { header?: React.ReactNode; children?: React.ReactNode }) {
  const t = useTranslations("auth.otp");
  const common = useTranslations("common");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isEmailValid = emailSchema.safeParse(email.trim()).success;
  const { conditional } = usePasskeySupport();
  const formRef = useRef<HTMLFormElement>(null);

  // The on-screen keyboard covers the layout viewport on iOS, which hides the centered submit button. Track the
  // visible height so the page (min-h-[var(--visual-vh)]) re-centers its content above the keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--visual-vh", `${vv.height}px`);
    update();
    vv.addEventListener("resize", update);
    return () => {
      vv.removeEventListener("resize", update);
      root.style.removeProperty("--visual-vh");
    };
  }, []);

  // On mobile the keyboard covers the lower part of the screen, so once the submit button is revealed
  // (after its height transition) scroll it into view instead of leaving it hidden behind the keyboard.
  useEffect(() => {
    if (!isEmailValid || step !== "email") return;
    const timer = setTimeout(() => {
      formRef.current
        ?.querySelector<HTMLElement>('button[type="submit"]')
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 320);
    return () => clearTimeout(timer);
  }, [isEmailValid, step]);

  // Conditional UI: passkeys saved on this device show up in the email field's autofill.
  useEffect(() => {
    if (!conditional || step !== "email") return;
    authClient.signIn.passkey({ autoFill: true }).then(({ data }) => {
      if (data) {
        setDevicePasskey(true);
        router.push("/dashboard");
        router.refresh();
      }
    });
  }, [conditional, step, router]);

  async function sendCode(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    // Read the live field value: autofill can fill it without React state having caught up.
    const field = formRef.current?.elements.namedItem("email");
    const value = (field instanceof HTMLInputElement ? field.value : email).trim();
    if (value !== email.trim()) setEmail(value);
    if (!emailSchema.safeParse(value).success) {
      setError(t("sendError"));
      return;
    }
    setIsLoading(true);
    setError(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: value,
      type: "sign-in",
    });
    setIsLoading(false);
    if (error) {
      setError(t("sendError"));
      return;
    }
    setCode("");
    setStep("otp");
  }

  async function verify(value: string) {
    setIsLoading(true);
    setError(null);
    const { error } = await authClient.signIn.emailOtp({ email, otp: value });
    if (error) {
      setIsLoading(false);
      setCode("");
      setError(t("invalid"));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (step === "email") {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <form ref={formRef} onSubmit={sendCode} className="flex flex-col gap-3">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username webauthn"
            placeholder={t("emailPlaceholder")}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onInput={(e) => setEmail(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              if (isEmailValid && !isLoading) void sendCode();
            }}
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Reveal open={isEmailValid}>
            <Button size="lg" type="submit" className="w-full" isLoading={isLoading}>
              {common("continue")}
            </Button>
          </Reveal>
        </form>
        <Reveal open={!isEmailValid}>{children}</Reveal>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={common("back")}
        className="fixed top-4 left-4 rounded-full bg-secondary"
        onClick={() => {
          setStep("email");
          setCode("");
          setError(null);
        }}
      >
        <ArrowLeft />
      </Button>
      {/* <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Envelope className="size-6" />
      </div> */}
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t.rich("sentTo", { email: email.trim(), strong: (chunks) => <strong>{chunks}</strong> })}
        </p>
      </div>
      <InputOTP
        maxLength={OTP_LENGTH}
        value={code}
        onChange={setCode}
        onComplete={verify}
        disabled={isLoading}
        autoFocus
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="000000"
        autoComplete="one-time-code"
        aria-label={t("codeLabel")}
        aria-invalid={error ? true : undefined}
        containerClassName="w-full justify-center gap-2 sm:w-auto sm:gap-3"
      >
        <InputOTPGroup className="flex-1 gap-1.5 sm:flex-none sm:gap-2">
          {[0, 1, 2].map((i) => (
            <InputOTPSlot key={i} index={i} className={slotClassName} />
          ))}
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup className="flex-1 gap-1.5 sm:flex-none sm:gap-2">
          {[3, 4, 5].map((i) => (
            <InputOTPSlot key={i} index={i} className={slotClassName} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <p className="text-muted-foreground">
        {t("noCode")}{" "}
        <button
          type="button"
          className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
          disabled={isLoading}
          onClick={async () => {
            await sendCode();
            toast.success(t("resent"));
          }}
        >
          {t("resend")}
        </button>
      </p>
    </div>
  );
}
