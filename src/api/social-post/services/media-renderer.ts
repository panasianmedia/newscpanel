import axios from 'axios';
import sharp from 'sharp';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return entities[character];
  });
}

function wrapTitle(title: string, fontSize: number, width: number): string[] {
  const maxCharacters = Math.max(1, Math.floor((width - 120) / (fontSize * 0.56)));
  const lines: string[] = [];
  let currentLine = '';

  for (const word of title.trim().split(/\s+/)) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxCharacters && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function titleSvg(title: string, width: number, height: number): Buffer {
  let fontSize = Math.min(64, Math.floor(height / 5));
  let lines = wrapTitle(title, fontSize, width);

  while (lines.length > 4 && fontSize > 24) {
    fontSize -= 2;
    lines = wrapTitle(title, fontSize, width);
  }

  if (lines.length > 4) {
    lines = lines.slice(0, 4);
    lines[3] = `${lines[3].slice(0, Math.max(1, lines[3].length - 3))}...`;
  }

  const lineHeight = Math.round(fontSize * 1.2);
  const firstBaseline = Math.round((height - lineHeight * lines.length) / 2 + fontSize);
  const text = lines
    .map(
      (line, index) =>
        `<text x="${width / 2}" y="${firstBaseline + lineHeight * index}" font-size="${fontSize}">${escapeXml(line)}</text>`,
    )
    .join('');

  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g fill="#d71920" stroke="#fff" stroke-width="2" paint-order="stroke" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700">${text}</g></svg>`,
  );
}

export async function renderBrandedImage(imageUrl: string, title: string, framePath: string) {
  const directory = await mkdtemp(join(tmpdir(), 'social-post-'));
  const filePath = join(directory, 'social-post.jpg');

  try {
    const frameImage = sharp(framePath);
    const { width, height } = await frameImage.metadata();
    if (!width || !height) throw new Error('The social frame has invalid dimensions.');

    const imageHeight = Math.floor(height / 2);
    const titleHeight = height - imageHeight;
    const response = await axios.get<ArrayBuffer>(imageUrl, { responseType: 'arraybuffer' });
    const image = await sharp(Buffer.from(response.data))
      .rotate()
      .resize(width, imageHeight, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toBuffer();
    const frame = await frameImage.png().toBuffer();
    const output = await sharp(frame)
      .composite([
        { input: image, left: 0, top: 0 },
        { input: titleSvg(title, width, titleHeight), left: 0, top: imageHeight },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    await writeFile(filePath, output);
    return {
      filePath,
      size: output.length,
      cleanup: () => rm(directory, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}