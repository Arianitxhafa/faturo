"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputClass } from "./ui";

type Props = {
  label: string;
  name?: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  minLength?: number;
  hint?: string;
};

/** Password field with a show/hide toggle and a Caps Lock warning. */
export function PasswordInput({ label, name = "password", autoComplete, placeholder, minLength, hint }: Props) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // Hide the password again when the form is submitted, so password managers see a normal password field.
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const hide = () => setVisible(false);
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, []);

  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div className="grid gap-1.5 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onBlur={() => setCapsLock(false)}
          aria-describedby={hint || capsLock ? `${id}-hint` : undefined}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => {
            setVisible((v) => !v);
            ref.current?.focus();
          }}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          title={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted transition hover:text-fg focus-visible:text-brand focus-visible:outline-none"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {(hint || capsLock) && (
        <p id={`${id}-hint`} className={`text-xs font-normal ${capsLock ? "text-amber-700 dark:text-amber-400" : "text-muted"}`}>
          {capsLock ? "Caps Lock is on." : hint}
        </p>
      )}
    </div>
  );
}
