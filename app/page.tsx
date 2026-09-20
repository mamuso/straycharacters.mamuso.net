import Journal from "../components/Journal";
import { blocks, total, version } from "../lib/blocks";
export default function Home() {
  return (
    <Journal
      key={version}
      initial={blocks[0]}
      pageCount={blocks.length}
      total={total}
      version={version}
    />
  );
}
