"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { getProjects } from "@/lib/api";
import useData from "@/lib/useData";
import ProjectTable from "@/components/ProjectTable";
import { Empty, ErrorState, Loading } from "@/components/ui";

function List() {
  const q = useSearchParams().get("q") || "";
  const { data, error, loading, retry } = useData(getProjects);
  return (
    <>
      <h1 className="text-3xl font-bold">Monitored projects</h1>
      <p className="text-ink-500 mt-1 mb-8">Search and filter projects across the monitored portfolio.</p>
      {loading && <Loading rows={8} />}
      {error && <ErrorState message={error} retry={retry} />}
      {data && (data.length ? <ProjectTable key={q} projects={data} initialQuery={q} /> : <Empty message="No forecast data is available." action={<Link href="/settings" className="btn-primary inline-flex mt-4">Add forecast data</Link>} />)}
    </>
  );
}

export default function ProjectsPage() {
  return <Suspense fallback={<Loading rows={8} />}><List /></Suspense>;
}
