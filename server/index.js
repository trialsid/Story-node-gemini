import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync, unlink } from 'fs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const generatedDir = path.join(projectRoot, 'generated');
const metadataFile = path.join(generatedDir, 'gallery.json');

const app = express();
const PORT = process.env.GALLERY_SERVER_PORT ? Number(process.env.GALLERY_SERVER_PORT) : 4000;

app.use(express.json({ limit: '25mb' }));
app.use('/generated', express.static(generatedDir, { fallthrough: true }));

const ensureGeneratedDir = async () => {
  await fs.mkdir(generatedDir, { recursive: true });
};

const readMetadata = async () => {
  try {
    const raw = await fs.readFile(metadataFile, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    if ((error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') || error instanceof Error && error.message.includes('ENOENT')) {
      return [];
    }
    throw error;
  }
};

const writeMetadata = async (items) => {
  await fs.writeFile(metadataFile, JSON.stringify(items, null, 2), 'utf-8');
};

const dataUrlToBuffer = (dataUrl) => {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) {
    throw new Error('Invalid data URL');
  }
  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  return { buffer, mimeType };
};

const extensionFromMime = (mimeType) => {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType === 'video/mp4') return 'mp4';
  if (mimeType === 'video/webm') return 'webm';
  return 'bin';
};

const buildFileName = (type, extension) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${timestamp}-${type}-${randomUUID()}.${extension}`;
};

app.get('/api/gallery', async (_req, res) => {
  try {
    await ensureGeneratedDir();
    const items = await readMetadata();
    res.json({ items });
  } catch (error) {
    console.error('Failed to read gallery metadata', error);
    res.status(500).send('Failed to read gallery metadata');
  }
});

app.post('/api/gallery', async (req, res) => {
  try {
    const { dataUrl, type, prompt, nodeType, nodeId } = req.body ?? {};
    if (!dataUrl || !type) {
      return res.status(400).send('Missing dataUrl or type');
    }

    await ensureGeneratedDir();
    const { buffer, mimeType } = dataUrlToBuffer(dataUrl);
    const extension = extensionFromMime(mimeType);
    const fileName = buildFileName(type, extension);
    const filePath = path.join(generatedDir, fileName);
    await fs.writeFile(filePath, buffer);

    const items = await readMetadata();
    const newItem = {
      id: randomUUID(),
      type,
      fileName,
      createdAt: Date.now(),
      prompt,
      nodeType,
      nodeId,
      mimeType,
      url: `/generated/${fileName}`,
    };
    items.unshift(newItem);
    await writeMetadata(items);

    res.status(201).json({ item: newItem });
  } catch (error) {
    console.error('Failed to save gallery item', error);
    res.status(500).send('Failed to save gallery item');
  }
});

app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    await ensureGeneratedDir();
    const items = await readMetadata();
    const index = items.findIndex((item) => item.id === targetId);
    if (index === -1) {
      return res.status(204).end();
    }

    const [removed] = items.splice(index, 1);
    await writeMetadata(items);

    if (removed?.fileName) {
      const filePath = path.join(generatedDir, removed.fileName);
      if (existsSync(filePath)) {
        unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.warn('Failed to delete gallery file', err);
          }
        });
      }
    }

    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete gallery item', error);
    res.status(500).send('Failed to delete gallery item');
  }
});

app.listen(PORT, () => {
  console.log(`Gallery server listening on http://localhost:${PORT}`);
});
