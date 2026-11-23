"use client";

import React, { useEffect, useRef } from "react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (error: any) => void;
          "expired-callback"?: () => void;
          theme?: string;
          size?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  theme = "dark",
  size = "normal",
  className = "",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    "0x4AAAAAAGPNIAKkr1sYRPY7";

  useEffect(() => {
    let isMounted = true;

    function renderWidget() {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (isMounted) onVerify(token);
          },
          "error-callback": (err: any) => {
            if (isMounted && onError) onError(String(err));
          },
          "expired-callback": () => {
            if (isMounted && onExpire) onExpire();
          },
          theme,
          size,
        });
      } catch (e) {
        console.warn("[TurnstileWidget] Render exception:", e);
      }
    }

    // Check if script is already present
    const existingScript = document.getElementById("cf-turnstile-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "cf-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
      script.async = true;
      script.defer = true;
      window.onloadTurnstileCallback = () => {
        renderWidget();
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    } else {
      window.onloadTurnstileCallback = () => {
        renderWidget();
      };
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, [siteKey, onVerify, onError, onExpire, theme, size]);

  return <div ref={containerRef} className={`my-2 flex justify-center ${className}`} />;
}
