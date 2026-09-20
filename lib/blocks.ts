import data from "../.generated/blocks.json";
import type { Entry } from "./journal-types";
export type Block = { number: number; rows: Entry[][] };
export const blocks: Block[] = data.blocks;
export const version = data.version;
export const total = data.total;
