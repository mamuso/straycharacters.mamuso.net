import { notFound } from "next/navigation";
import Journal from "../../../components/Journal";
import { blocks, total, version } from "../../../lib/blocks";
export function generateStaticParams() {
  // Static export requires a parameter when there are no additional pages.
  // The reserved path resolves to notFound().
  return blocks.length > 1
    ? blocks.slice(1).map((block) => ({ page: String(block.number) }))
    : [{ page: "_empty" }];
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  return {
    title: `The collection · Page ${page}`,
    alternates: { canonical: `/journal/${page}/` },
  };
}
export default async function GalleryPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const block = blocks.find(
    (block) => block.number > 1 && String(block.number) === page,
  );
  if (!block) notFound();
  return (
    <Journal
      key={`${version}-${page}`}
      initial={block}
      pageCount={blocks.length}
      total={total}
      version={version}
    />
  );
}
