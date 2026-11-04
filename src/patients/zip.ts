/** Read the .ics files out of a zip archive (Google Calendar exports a zip). */

const u16 = (view: DataView, at: number) => view.getUint16(at, true);
const u32 = (view: DataView, at: number) => view.getUint32(at, true);

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** The text of every .ics entry in the archive. */
export async function icsFilesInZip(data: Uint8Array): Promise<string[]> {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let end = data.length - 22;
  while (end >= 0 && u32(view, end) !== 0x06054b50) end--;
  if (end < 0) throw new Error('This file is not a zip archive');
  const entries = u16(view, end + 10);
  let at = u32(view, end + 16);
  const texts: string[] = [];
  for (let i = 0; i < entries; i++) {
    if (u32(view, at) !== 0x02014b50) throw new Error('The zip archive is damaged');
    const method = u16(view, at + 10);
    const compressedSize = u32(view, at + 20);
    const nameLength = u16(view, at + 28);
    const extraLength = u16(view, at + 30);
    const commentLength = u16(view, at + 32);
    const localHeader = u32(view, at + 42);
    const name = new TextDecoder().decode(data.subarray(at + 46, at + 46 + nameLength));
    at += 46 + nameLength + extraLength + commentLength;
    if (!name.toLowerCase().endsWith('.ics')) continue;
    const dataStart = localHeader + 30 + u16(view, localHeader + 26) + u16(view, localHeader + 28);
    const compressed = data.subarray(dataStart, dataStart + compressedSize);
    if (method !== 0 && method !== 8) throw new Error(`Unsupported zip compression in ${name}`);
    texts.push(new TextDecoder().decode(method === 0 ? compressed : await inflateRaw(compressed)));
  }
  return texts;
}

/** The calendar text of an .ics file or of every .ics file in a zip. */
export async function calendarTexts(file: File): Promise<string[]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const isZip = data[0] === 0x50 && data[1] === 0x4b;
  return isZip ? icsFilesInZip(data) : [new TextDecoder().decode(data)];
}
