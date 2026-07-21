import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ eyebrow, title, description, href, linkLabel = "Lihat semua" }: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {href ? <Link href={href} className="text-link">{linkLabel} <ArrowRight size={17} /></Link> : null}
    </div>
  );
}
