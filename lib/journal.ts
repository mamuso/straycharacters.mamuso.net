import data from "../.generated/journal.json";
import type { Entry } from "./journal-types";
export { label, dateLabel, specimenLabel } from "./journal-types";
export type { Entry } from "./journal-types";
export const entries: Entry[] = data;
