import BackToCollection from "../../../components/BackToCollection";
import { blocks, version } from "../../../lib/blocks";
import { pageHref } from "../../../lib/pagination.mjs";
import ExpandablePhoto from "../../../components/ExpandablePhoto";
import PhotoNavigation from "../../../components/PhotoNavigation";
import * as stylex from "@stylexjs/stylex";
import { s } from "../../../styles/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { entries, label, dateLabel, specimenLabel } from "../../../lib/journal";
export function generateStaticParams() {
  // Static export requires a parameter even for an empty collection.
  // This reserved path resolves to notFound(), never to a specimen.
  return entries.length
    ? entries.map(({ slug }) => ({ slug }))
    : [{ slug: "_empty" }];
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = entries.find((entry) => entry.slug === slug);
  if (!entry) return {};
  const socialImage = {
    url: entry.ogImage,
    width: 1200,
    height: 630,
    alt: `${specimenLabel(entry)} — ${entry.alt || label(entry)}`,
  };
  return {
    title: label(entry),
    description: entry.note || entry.alt,
    alternates: { canonical: `/finds/${slug}/` },
    openGraph: {
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      images: [socialImage],
    },
  };
}
export default async function Find({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = entries.findIndex((entry) => entry.slug === slug);
  if (index < 0) notFound();
  const entry = entries[index];
  return (
    <article {...stylex.props(s.entry)}>
      <header {...stylex.props(s.detailMetadata)}>
        <BackToCollection
          version={version}
          fallback={pageHref(
            blocks.find((block) =>
              block.rows.some((row) => row.some((item) => item.slug === slug)),
            )?.number || 1,
          )}
        >
          <h1 {...stylex.props(s.entryHeading)}>
            <span {...stylex.props(Boolean(entry.title) && s.muted)}>
              {specimenLabel(entry)}
            </span>
            {entry.title ? <span>{entry.title}</span> : null}
          </h1>
          {entry.note || entry.location || entry.date ? (
            <div {...stylex.props(s.entryMetadata)}>
              {entry.note ? (
                <p {...stylex.props(s.entryNote)}>{entry.note}</p>
              ) : null}
              {entry.location ? (
                <span aria-label={`Location: ${entry.location}`}>
                  {entry.location}
                </span>
              ) : null}
              {entry.date ? (
                <time dateTime={entry.date}>{dateLabel(entry.date)}</time>
              ) : null}
            </div>
          ) : null}
        </BackToCollection>
      </header>
      <ExpandablePhoto
        key={entry.slug}
        slug={entry.slug}
        src={entry.src}
        width={entry.width}
        height={entry.height}
        alt={entry.alt || label(entry)}
      />
      <PhotoNavigation
        previous={
          entries[index - 1] ? `/finds/${entries[index - 1].slug}/` : undefined
        }
        next={
          entries[index + 1] ? `/finds/${entries[index + 1].slug}/` : undefined
        }
      />
    </article>
  );
}
