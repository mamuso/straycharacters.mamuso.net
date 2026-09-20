import data from "../.generated/journal.json";
import type { Entry } from "./journal-types";
export { label, dateLabel, specimenLabel } from "./journal-types";
export type { Entry } from "./journal-types";
// prepare.mjs validates content before writing this build snapshot.
// JSON imports widen literal strings such as locationSource.
export const entries = data as Entry[];
