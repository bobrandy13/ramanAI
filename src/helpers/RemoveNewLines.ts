export default function RemoveNewLines(s: string): string {
  return s.replace(/(\r\n|\n|\r)/gm, '');
}
