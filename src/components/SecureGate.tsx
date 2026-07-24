"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArchiveExperience } from "@/components/ArchiveExperience";
import type { GateConfig } from "@/types/gate";

const gateConfig: GateConfig = {
  topbarTitle: "2212.VN // SECURE GATEWAY",
  nodeLabel: "SEVER: HN-01",
  classification: "TỐI MẬT",
  logoSrc: "/images/2212/2212VN-LG-3-removebg-preview.png",
  logoAlt: "2212 Viet Nam",
  siteName: "2212 VIET NAM",
  subtitle: "KHO LƯU TRỮ TỐI MẬT — TRUY CẬP HẠN CHẾ",
  bootLines: [
    "> KHỞI TẠO GIAO THỨC BẢO MẬT 2212",
    "> KẾT NỐI MÁY CHỦ HN-01 · AES-256",
    "> ĐỒNG BỘ CHỈ MỤC KHO LƯU TRỮ",
  ],
  waitingLabel: "> CHỜ XÁC THỰC DANH TÍNH",
  userLabel: "MÃ ĐỊNH DANH / OPERATIVE ID",
  userPlaceholder: "ID-XXXX",
  passwordLabel: "MẬT MÃ TRUY CẬP / ACCESS CODE",
  passwordPlaceholder: "••••••",
  submitLabel: "XÁC THỰC DANH TÍNH ▸",
  pendingLabel: "ĐANG XÁC THỰC…",
  helpText:
    "CHƯA CÓ MÃ TRUY CẬP?\nLIÊN HỆ BAN ĐIỀU HÀNH 2212 VIET NAM\nĐỂ ĐƯỢC CẤP QUYỀN ĐỘC GIẢ",
  warningText: "CẢNH BÁO: HỆ THỐNG DÀNH RIÊNG CHO NHÂN SỰ ĐƯỢC CẤP QUYỀN.",
  traceText:
    "MỌI PHIÊN TRUY CẬP ĐỀU ĐƯỢC GIÁM SÁT VÀ GHI LẠI — ĐIỀU 2212VN/QĐ-BM.",
  authSteps: [
    "> XÁC THỰC MÃ ĐỊNH DANH",
    "> ĐỐI CHIẾU QUYỀN TRUY CẬP",
    "> GIẢI MÃ MỤC KHO LƯU TRỮ",
    "> CẤP PHIÊN TRUY CẬP",
  ],
  grantedLabel: "ĐÃ CẤP QUYỀN TRUY CẬP",
};

const validOperativeIds = new Set(["ID-GUEST", "IDGUEST", "GUEST"]);
const validAccessCode = "p2212vn!";
const sessionCookieName = "2212_archive_session";
const sessionCookieMaxAge = 60 * 60 * 24 * 7;

function normalizeOperativeId(value: string) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

function normalizeAccessCode(value: string) {
  return value.trim().replace("！", "!").toLowerCase();
}

function isValidCredential(operativeId: string, accessCode: string) {
  return validOperativeIds.has(operativeId) && accessCode === validAccessCode;
}

function setArchiveSessionCookie() {
  document.cookie = `${sessionCookieName}=granted; Max-Age=${sessionCookieMaxAge}; Path=/; SameSite=Lax`;
}

function clearArchiveSessionCookie() {
  document.cookie = `${sessionCookieName}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function showArchiveAfterTransfer(setAuthenticated: (value: boolean) => void) {
  window.setTimeout(() => {
    setAuthenticated(true);
    window.scrollTo(0, 0);
  }, 1750);
}

function formatSaigonTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function SecureGate({
  initialAuthenticated = false,
}: {
  initialAuthenticated?: boolean;
}) {
  const [time, setTime] = useState("--:--:--");
  const [pending, setPending] = useState(false);
  const [granted, setGranted] = useState(false);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [error, setError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(formatSaigonTime(new Date()));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const operativeId = normalizeOperativeId(search.get("operativeId") ?? "");
    const accessCode = normalizeAccessCode(search.get("accessCode") ?? "");
    const hasCredentialQuery = search.has("operativeId") || search.has("accessCode");

    if (hasCredentialQuery) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    if (isValidCredential(operativeId, accessCode)) {
      setArchiveSessionCookie();
      window.setTimeout(() => {
        setGranted(true);
        showArchiveAfterTransfer(setAuthenticated);
      }, 0);
    }
  }, []);

  const bootRows = useMemo(
    () => [...gateConfig.bootLines, gateConfig.waitingLabel],
    [],
  );

  function authenticate(form: HTMLFormElement | null) {
    if (!form || pending) {
      return;
    }

    if (!form.reportValidity()) {
      return;
    }

    const operativeInput = form.querySelector<HTMLInputElement>('[data-field="operative-id"]');
    const accessInput = form.querySelector<HTMLInputElement>('[data-field="access-code"]');
    const operativeId = normalizeOperativeId(operativeInput?.value ?? "");
    const accessCode = normalizeAccessCode(accessInput?.value ?? "");
    const valid = isValidCredential(operativeId, accessCode);

    setError(false);
    setPending(true);

    if (!valid) {
      window.setTimeout(() => {
        setPending(false);
        setError(true);
      }, 650);
      return;
    }

    window.setTimeout(() => {
      setPending(false);
      setGranted(true);
      setArchiveSessionCookie();
      showArchiveAfterTransfer(setAuthenticated);
    }, 550);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    authenticate(event.currentTarget);
  }

  if (authenticated) {
    return (
      <ArchiveExperience
        onLogout={() => {
          clearArchiveSessionCookie();
          setAuthenticated(false);
          setGranted(false);
          setPending(false);
          setError(false);
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  return (
    <main className="gate">
      <div aria-hidden="true" className="gate__grid" />
      <div aria-hidden="true" className="gate__radar" />
      <div aria-hidden="true" className="gate__ring gate__ring--lg" />
      <div aria-hidden="true" className="gate__ring gate__ring--sm" />
      <div aria-hidden="true" className="gate__falloff" />

      <div className="gate__topbar">
        <span>{gateConfig.topbarTitle}</span>
        <span className="gate__topbar-right">
          <span className="gate__node">{gateConfig.nodeLabel}</span>
          <span>UTC+7 {time}</span>
        </span>
      </div>

      <section className="gate__stage" aria-label="Secure archive gateway">
        <div className="gate__card">
          <span className="sa-corner tl" />
          <span className="sa-corner tr" />
          <span className="sa-corner bl" />
          <span className="sa-corner br" />
          <span aria-hidden="true" className="gate__scanbar" />

          <div className="gate__band">
            <span>■</span>
            <span>{gateConfig.classification}</span>
            <span>■</span>
          </div>

          <div className="gate__body">
            <div className="gate__brand">
              <Image
                className="gate__logo"
                src={gateConfig.logoSrc}
                alt={gateConfig.logoAlt}
                width={104}
                height={104}
                priority
              />
              <h1 className="gate__title">{gateConfig.siteName}</h1>
              <div className="gate__subtitle">{gateConfig.subtitle}</div>
            </div>

            <div className="gate__divider" aria-hidden="true">
              <span />
              <i />
              <span />
            </div>

            <div className="gate__boot" aria-label="System status">
              {bootRows.map((line, index) => (
                <div className="gate__boot-row" key={line}>
                  <span className={index === bootRows.length - 1 ? "gate__boot-await" : undefined}>
                    {line}
                    {index === bootRows.length - 1 ? (
                      <span className="gate__caret" aria-hidden="true" />
                    ) : null}
                  </span>
                  {index !== bootRows.length - 1 ? <span className="gate__leader" /> : null}
                </div>
              ))}
            </div>

            <form
              className="gate__form"
              ref={formRef}
              onInput={() => setError(false)}
              onSubmit={handleSubmit}
            >
              <label className="gate__label">
                <span>{gateConfig.userLabel}</span>
                <input
                  className="gate__input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={gateConfig.userPlaceholder}
                  required
                  data-field="operative-id"
                />
              </label>
              <label className="gate__label">
                <span>{gateConfig.passwordLabel}</span>
                <input
                  className="gate__input gate__input--code"
                  type="password"
                  autoComplete="off"
                  placeholder={gateConfig.passwordPlaceholder}
                  required
                  data-field="access-code"
                />
              </label>
              <button
                className="gate__submit"
                type="button"
                disabled={pending}
                onClick={() => authenticate(formRef.current)}
              >
                {pending ? gateConfig.pendingLabel : gateConfig.submitLabel}
              </button>
            </form>
            {error ? (
              <div className="gate__error">
                <span>!</span>
                <span>THÔNG TIN XÁC THỰC KHÔNG HỢP LỆ</span>
              </div>
            ) : null}

            <div className="gate__help">{gateConfig.helpText}</div>
          </div>
        </div>
      </section>

      <p className="gate__warn">
        {gateConfig.warningText}
        <br />
        {gateConfig.traceText}
      </p>

      {granted ? (
        <div className="auth" role="status" aria-live="polite">
          <div className="auth__inner">
            <div className="auth__session">SESSION // 2212VN-GATE</div>
            <div className="auth__lines">
              {gateConfig.authSteps.map((step) => (
                <div className="auth__line" key={step}>
                  <b>{step}</b> ... OK
                </div>
              ))}
            </div>
            <div className="auth__granted-wrap">
              <div className="auth__granted">{gateConfig.grantedLabel}</div>
            </div>
          </div>
        </div>
      ) : null}

      <div aria-hidden="true" className="sa-scanlines" />
      <div aria-hidden="true" className="sa-vignette" />
    </main>
  );
}
