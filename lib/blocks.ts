import data from "../.generated/blocks.json";
import type { Entry } from "./journal-types";
export type Block = { number: number; rows: Entry[][] };
// Rows contain the same validated entries as the journal build snapshot.
export const blocks = data.blocks as Block[];
export const version = data.version;
export const total = data.total;
