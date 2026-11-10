import Image from "next/image";
import Link from "next/link";

export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2.5 ${className}`} aria-label="Scrap Bays Limited — home">
      <span className={`grid size-10 place-items-center overflow-hidden rounded-md ${light ? "bg-white" : "bg-white ring-1 ring-steel-200"}`}>
        <Image src="/icons/logo-512.png" alt="" width={40} height={40} className="size-10" priority />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.35rem] font-bold tracking-tight ${light ? "text-white" : "text-steel-900"}`}>Scrap Bays</span>
        <span className={`text-[0.68rem] font-semibold tracking-[0.2em] uppercase ${light ? "text-brand-200" : "text-brand-700"}`}>Limited</span>
      </span>
    </Link>
  );
}
