export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
}) {
  return `${src}-${width}.webp`;
}
