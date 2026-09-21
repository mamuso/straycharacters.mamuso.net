export type Entry = {
  slug: string;
  specimenNumber: number;
  image: string;
  src: string;
  ogImage: string;
  width: number;
  height: number;
  title?: string;
  alt?: string;
  note?: string;
  location?: string;
  locationSource?: "openstreetmap";
  date?: string;
};
export const specimenLabel = (entry: Entry) =>
  `Specimen No. ${String(entry.specimenNumber).padStart(3, "0")}`;
export const label = (entry: Entry) => entry.title || specimenLabel(entry);
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
