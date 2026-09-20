import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import { s } from "../styles/site";
export default function NotFound() {
  return (
    <section {...stylex.props(s.notFound)}>
      <p {...stylex.props(s.muted)}>404 · Nothing here</p>
      <h1 {...stylex.props(s.heading)}>This one got away.</h1>
      <Link href="/" {...stylex.props(s.link)}>
        Back to the collection →
      </Link>
    </section>
  );
}
