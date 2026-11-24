"use client";

import React, { useEffect, useRef, useState } from "react";

interface TurnstileWidgetProps {
  sitekey?: string;
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
  sitekey,
  onVerify,
  onError,
  onExpire,
  theme = "light",
  size = "normal",
  className = "",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const defaultSiteKey =
    sitekey ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    "0x4AAAAAAGPNIAKkr1sYRPY7";

  const [activeSiteKey, setActiveSiteKey] = useState<string>(defaultSiteKey);

  // Preserve latest callbacks across renders without triggering useEffect re-runs
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (sitekey && sitekey !== activeSiteKey) {
      setActiveSiteKey(sitekey);
    }
  }, [sitekey]);

  useEffect(() => {
    let isMounted = true;

    function renderWidget() {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      // Clean up previous instance in this container if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {}
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: activeSiteKey,
          callback: (token: string) => {
            if (isMounted) {
              onVerifyRef.current?.(token);
            }
          },
          "error-callback": (err: any) => {
            console.warn("[TurnstileWidget] Challenge Error:", err);
            // If domain not allowed (e.g. running on localhost with a domain-restricted prod key)
            if (
              typeof window !== "undefined" &&
              (window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1") &&
              activeSiteKey !== "1x00000000000000000000AA"
            ) {
              console.log(
                "[TurnstileWidget] Domain restricted on local environment, switching to Cloudflare test key."
              );
              setActiveSiteKey("1x00000000000000000000AA");
              return;
            }
            if (isMounted) {
              onErrorRef.current?.(String(err));
            }
          },
          "expired-callback": () => {
            if (isMounted) {
              onExpireRef.current?.();
              if (widgetIdRef.current && window.turnstile) {
                try {
                  window.turnstile.reset(widgetIdRef.current);
                } catch {}
              }
            }
          },
          theme: theme || "light",
          size: size || "normal",
        });
      } catch (e) {
        console.warn("[TurnstileWidget] Render exception:", e);
      }
    }

    function checkAndRender() {
      if (!isMounted || !containerRef.current) return;
      if (typeof window !== "undefined" && window.turnstile) {
        renderWidget();
      } else {
        const interval = setInterval(() => {
          if (!isMounted) {
            clearInterval(interval);
            return;
          }
          if (typeof window !== "undefined" && window.turnstile && containerRef.current) {
            clearInterval(interval);
            renderWidget();
          }
        }, 80);
        setTimeout(() => clearInterval(interval), 10000);
      }
    }

    // Ensure Cloudflare Turnstile script is loaded
    const SCRIPT_ID = "cf-turnstile-script";
    const existingScript = document.getElementById(SCRIPT_ID);

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit";
      script.async = true;
      script.defer = true;
      window.onloadTurnstileCallback = () => {
        if (isMounted) checkAndRender();
      };
      document.head.appendChild(script);
    } else {
      window.onloadTurnstileCallback = () => {
        if (isMounted) checkAndRender();
      };
    }

    checkAndRender();

    return () => {
      isMounted = false;
      if (widgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {}
      }
    };
  }, [activeSiteKey, theme, size]);

  return (
    <div className={`my-2 flex flex-col items-center justify-center w-full ${className}`}>
      <div
        ref={containerRef}
        className="min-h-[65px] flex items-center justify-center"
      />
    </div>
  );
}
