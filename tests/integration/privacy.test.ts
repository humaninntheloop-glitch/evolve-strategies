import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const auth = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth }) }));
import { updateSession } from "@/lib/supabase/middleware";
import PrivacyPage, { metadata } from "@/app/privacy/page";

beforeEach(() => { auth.getUser.mockReset(); auth.getUser.mockResolvedValue({ data: { user: null } }); });

describe("public privacy policy", () => {
  it.each(["/", "/privacy"])("allows %s without a session", async path => {
    const response = await updateSession(new NextRequest(`https://platform.test${path}`));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
  it.each(["/admin", "/privacy/private"])("still protects %s", async path => {
    const response = await updateSession(new NextRequest(`https://platform.test${path}`));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://platform.test/login");
  });
  it("keeps the policy accessible to signed-in users too", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "user-a" } } });
    const response = await updateSession(new NextRequest("https://platform.test/privacy"));
    expect(response.headers.get("location")).toBeNull();
  });
  it("renders all nine policy sections as static HTML", () => {
    const html = renderToStaticMarkup(createElement(PrivacyPage));
    expect(metadata.title).toBe("Privacy Policy — Reliance Tracker");
    expect(html).toContain("Privacy Policy — Reliance Tracker");
    expect(html.match(/<section /g)).toHaveLength(9);
    expect(html).toContain('dateTime="2026-10-06"');
    expect(html).toContain("SHA-256 hashes");
    expect(html).toContain('href="mailto:humaninntheloop@gmail.com"');
    expect(html).not.toContain("<script");
  });
});
