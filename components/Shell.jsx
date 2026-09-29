"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";

const NAV = [
  ["/dashboard", "Home"],
  ["/project-map", "India Map"],
  ["/risk-radar", "Risk Radar"],
  ["/simulator", "What-if Simulator"],
  ["/projects", "Projects"],
  ["/contractors", "Contractors"],
  ["/early-warning", "Early Warnings"],
  ["/analytics", "Analytics"],
  ["/reports", "Reports & Exports"],
  ["/settings", "Settings"]
];

const TITLES = Object.fromEntries(NAV.map(([h, l]) => [h.slice(1), l]));

export default function Shell({ children }) {
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) router.push("/projects?q=" + encodeURIComponent(q.trim()));
  };

  const crumbs = path.split("/").filter(Boolean).map((seg, i, all) => ({
    label: TITLES[seg] || seg,
    href: "/" + all.slice(0, i + 1).join("/")
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <div data-print-hide="true" className="bg-gov-900 text-white text-xs">
        <div className="px-4 py-1.5 flex items-center justify-between gap-4">
          <span>Infrastructure Risk &amp; Monitoring Analysis Network</span>
          <span className="hidden sm:flex gap-5">
            <span>Public infrastructure portfolio</span>
            <span className="opacity-70">Portfolio intelligence</span>
          </span>
        </div>
      </div>

      <header data-print-hide="true" className="border-b border-ink-200 bg-white/95">
        <div className="px-4 py-4 flex items-center gap-4 sm:gap-6">
          <Image src="/icon.svg" alt="NIRMAN" height={20} width={40} />
          <div className="sm:border-r border-ink-200 sm:pr-6">
            <p className="text-2xl font-bold leading-none">NIRMAN </p>
            <p className="text-xs text-ink-500 mt-1">Infrastructure risk monitoring</p>
          </div>
          <p className="hidden xl:block text-sm leading-tight">
            <span className="text-ink-500">Project portfolio</span><br />
            <span className="font-semibold text-gov-800">Forecast intelligence</span>
          </p>
          <form onSubmit={submit} className="hidden md:flex flex-1 max-w-xl relative">
            <label htmlFor="search" className="sr-only">Search projects, states and agencies</label>
            <Icon name="search" className="h-4 w-4 text-ink-500 absolute left-3 top-3.5" />
            <input id="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search project, state, agency or sector" className="field pl-9" />
          </form>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-ink-500">Forecast horizon</p>
              <p className="text-sm font-semibold">6 and 12 months</p>
            </div>
            <Icon name="bell" className="h-5 w-5 text-ink-700" />
            <span className="h-9 w-9 bg-gov-800 text-white grid place-items-center text-sm font-semibold rounded-full shadow-sm" aria-label="Monitoring officer">MO</span>
          </div>
        </div>
      </header>

      <nav data-print-hide="true" aria-label="Sections" className="bg-gov-900 overflow-x-auto">
        <div className="flex min-w-max px-2 py-0.5">
          {NAV.map(([href, label]) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={`px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-all ${
                  active ? "bg-gov-700 text-white rounded-t-md" : "text-white/85 hover:bg-gov-800 hover:text-white rounded-t-md"}`}>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>


      {crumbs.length > 0 && path !== "/dashboard" && (
        <nav data-print-hide="true" aria-label="Breadcrumb" className="px-4 sm:px-8 pt-5 flex flex-wrap items-center gap-2 text-sm text-ink-500">
          <Link href="/dashboard" className="hover:underline">Home</Link>
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-2">
              <Icon name="chevronRight" className="h-3.5 w-3.5" />
              {i === crumbs.length - 1
                ? <span className="text-ink-900">{c.label}</span>
                : <Link href={c.href} className="hover:underline">{c.label}</Link>}
            </span>
          ))}
        </nav>
      )}
      <main className="px-4 sm:px-8 py-8 max-w-[1500px] w-full mx-auto">{children}</main>
    </div>
  );
}
