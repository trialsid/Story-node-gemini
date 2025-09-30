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
const projectsDir = path.join(generatedDir, 'projects');
const projectsMetadataFile = path.join(generatedDir, 'projects.json');

const app = express();
const PORT = process.env.GALLERY_SERVER_PORT ? Number(process.env.GALLERY_SERVER_PORT) : 4000;

const INIT_PROJECT_ID = 'init';
const INIT_PROJECT_NAME = 'Init';
const EMPTY_CANVAS_STATE = { nodes: [], connections: [] };

app.use(express.json({ limit: '25mb' }));
app.use('/generated', express.static(generatedDir, { fallthrough: true }));

const ensureGeneratedDir = async () => {
  await fs.mkdir(generatedDir, { recursive: true });
};

const ensureProjectsDir = async () => {
  await ensureGeneratedDir();
  await fs.mkdir(projectsDir, { recursive: true });
};

const ensureProjectMediaDir = async (projectId) => {
  if (!projectId) {
    return;
  }
  await fs.mkdir(path.join(projectsDir, projectId, 'media'), { recursive: true });
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

const readProjectsMetadata = async () => {
  try {
    const raw = await fs.readFile(projectsMetadataFile, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    if ((error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') || (error instanceof Error && error.message.includes('ENOENT'))) {
      return [];
    }
    throw error;
  }
};

const writeProjectsMetadata = async (projects) => {
  await fs.writeFile(projectsMetadataFile, JSON.stringify(projects, null, 2), 'utf-8');
};

const readProjectState = async (projectId) => {
  const projectFile = path.join(projectsDir, `${projectId}.json`);
  try {
    const raw = await fs.readFile(projectFile, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if ((error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') || (error instanceof Error && error.message.includes('ENOENT'))) {
      return null;
    }
    throw error;
  }
};

const writeProjectState = async (projectId, state) => {
  const projectFile = path.join(projectsDir, `${projectId}.json`);
  await fs.writeFile(projectFile, JSON.stringify(state, null, 2), 'utf-8');
};

const resolveGalleryFilePath = (projectId, fileName) => {
  if (projectId) {
    return path.join(projectsDir, projectId, 'media', fileName);
  }
  return path.join(generatedDir, fileName);
};

const buildGalleryFileUrl = (projectId, fileName) => {
  if (projectId) {
    return `/generated/projects/${projectId}/media/${fileName}`;
  }
  return `/generated/${fileName}`;
};

const moveFile = async (sourcePath, targetPath) => {
  try {
    await fs.rename(sourcePath, targetPath);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      if (error.code === 'EEXIST') {
        await fs.unlink(targetPath);
        await fs.rename(sourcePath, targetPath);
        return true;
      }
      if (error.code === 'EXDEV') {
        const data = await fs.readFile(sourcePath);
        await fs.writeFile(targetPath, data);
        await fs.unlink(sourcePath);
        return true;
      }
    }
    throw error;
  }
};

const ensureInitProject = async () => {
  await ensureProjectsDir();
  let projects = await readProjectsMetadata();
  let initProject = projects.find((project) => project.id === INIT_PROJECT_ID);
  const now = Date.now();
  let updatedProjects = false;

  if (!initProject) {
    initProject = {
      id: INIT_PROJECT_ID,
      name: INIT_PROJECT_NAME,
      createdAt: now,
      updatedAt: now,
    };
    projects = [initProject, ...projects];
    updatedProjects = true;
  } else {
    const filtered = projects.filter((project) => project.id !== INIT_PROJECT_ID);
    projects = [initProject, ...filtered];
    updatedProjects = true;
  }

  if (updatedProjects) {
    await writeProjectsMetadata(projects);
  }

  const initProjectStateFile = path.join(projectsDir, `${INIT_PROJECT_ID}.json`);
  if (!existsSync(initProjectStateFile)) {
    await writeProjectState(INIT_PROJECT_ID, { canvas: EMPTY_CANVAS_STATE });
  }

  await ensureProjectMediaDir(INIT_PROJECT_ID);
};

const migrateLegacyGalleryMedia = async () => {
  await ensureGeneratedDir();
  await ensureInitProject();

  const items = await readMetadata();
  let updated = false;

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    if (!item.projectId) {
      const sourcePath = path.join(generatedDir, item.fileName);
      const targetDir = path.join(projectsDir, INIT_PROJECT_ID, 'media');
      const targetPath = path.join(targetDir, item.fileName);

      await fs.mkdir(targetDir, { recursive: true });

      let moved = false;
      if (existsSync(sourcePath)) {
        moved = await moveFile(sourcePath, targetPath);
      } else if (existsSync(targetPath)) {
        moved = true;
      }

      if (moved) {
        item.projectId = INIT_PROJECT_ID;
        item.url = buildGalleryFileUrl(INIT_PROJECT_ID, item.fileName);
        updated = true;
      }
    } else {
      const expectedPath = resolveGalleryFilePath(item.projectId, item.fileName);
      if (!existsSync(expectedPath)) {
        const legacyPath = path.join(generatedDir, item.fileName);
        if (existsSync(legacyPath)) {
          const targetDir = path.dirname(expectedPath);
          await fs.mkdir(targetDir, { recursive: true });
          const moved = await moveFile(legacyPath, expectedPath);
          if (moved) {
            item.url = buildGalleryFileUrl(item.projectId, item.fileName);
            updated = true;
          }
        }
      } else {
        const normalizedUrl = buildGalleryFileUrl(item.projectId, item.fileName);
        if (item.url !== normalizedUrl) {
          item.url = normalizedUrl;
          updated = true;
        }
      }
    }
  }

  if (updated) {
    await writeMetadata(items);
  }
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

app.get('/api/gallery', async (req, res) => {
  try {
    await ensureGeneratedDir();
    const items = await readMetadata();
    const requestedProjectId = typeof req.query.projectId === 'string' && req.query.projectId.length > 0
      ? req.query.projectId
      : null;
    const filtered = requestedProjectId
      ? items.filter((item) => item.projectId === requestedProjectId)
      : items;
    const normalized = filtered.map((item) => ({
      ...item,
      url: buildGalleryFileUrl(item.projectId, item.fileName),
    }));
    res.json({ items: normalized });
  } catch (error) {
    console.error('Failed to read gallery metadata', error);
    res.status(500).send('Failed to read gallery metadata');
  }
});

app.post('/api/gallery', async (req, res) => {
  try {
    const { dataUrl, type, prompt, nodeType, nodeId, projectId } = req.body ?? {};
    if (!dataUrl || !type) {
      return res.status(400).send('Missing dataUrl or type');
    }

    await ensureGeneratedDir();
    if (projectId) {
      await ensureProjectMediaDir(projectId);
    }
    const { buffer, mimeType } = dataUrlToBuffer(dataUrl);
    const extension = extensionFromMime(mimeType);
    const fileName = buildFileName(type, extension);
    const filePath = resolveGalleryFilePath(projectId, fileName);
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
      projectId: projectId || undefined,
      url: buildGalleryFileUrl(projectId, fileName),
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
      const filePath = resolveGalleryFilePath(removed?.projectId, removed.fileName);
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

app.get('/api/projects', async (_req, res) => {
  try {
    await ensureProjectsDir();
    const projects = await readProjectsMetadata();
    res.json({ projects });
  } catch (error) {
    console.error('Failed to read projects metadata', error);
    res.status(500).send('Failed to read projects metadata');
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    await ensureProjectsDir();
    const projects = await readProjectsMetadata();
    const metadata = projects.find((project) => project.id === projectId);
    if (!metadata) {
      return res.status(404).send('Project not found');
    }
    const state = await readProjectState(projectId);
    res.json({ project: { metadata, state: state ?? {} } });
  } catch (error) {
    console.error('Failed to read project', error);
    res.status(500).send('Failed to read project');
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, state = null } = req.body ?? {};
    if (!name || typeof name !== 'string') {
      return res.status(400).send('Project name is required');
    }

    await ensureProjectsDir();
    const projects = await readProjectsMetadata();
    const now = Date.now();
    const id = randomUUID();
    const metadata = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
    };

    projects.unshift(metadata);
    await writeProjectsMetadata(projects);

    if (state !== null && state !== undefined) {
      await writeProjectState(id, state);
    } else {
      await writeProjectState(id, {});
    }

    await ensureProjectMediaDir(id);

    res.status(201).json({ project: { metadata } });
  } catch (error) {
    console.error('Failed to create project', error);
    res.status(500).send('Failed to create project');
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, state } = req.body ?? {};
    await ensureProjectsDir();
    const projects = await readProjectsMetadata();
    const index = projects.findIndex((project) => project.id === projectId);
    if (index === -1) {
      return res.status(404).send('Project not found');
    }

    const now = Date.now();
    const existing = projects[index];
    const updatedMetadata = {
      ...existing,
      name: typeof name === 'string' && name.length > 0 ? name : existing.name,
      updatedAt: now,
    };
    projects[index] = updatedMetadata;
    await writeProjectsMetadata(projects);

    if (state !== undefined) {
      await writeProjectState(projectId, state ?? {});
    }

    res.json({ project: { metadata: updatedMetadata } });
  } catch (error) {
    console.error('Failed to update project', error);
    res.status(500).send('Failed to update project');
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    await ensureProjectsDir();
    const projects = await readProjectsMetadata();
    const index = projects.findIndex((project) => project.id === projectId);
    if (index === -1) {
      return res.status(204).end();
    }

    projects.splice(index, 1);
    await writeProjectsMetadata(projects);

    // Remove orphaned gallery items for this project
    try {
      const galleryItems = await readMetadata();
      const filteredItems = galleryItems.filter(item => item.projectId !== projectId);
      await writeMetadata(filteredItems);
    } catch (err) {
      console.warn('Failed to clean up gallery items for deleted project', err);
    }

    const projectFile = path.join(projectsDir, `${projectId}.json`);
    if (existsSync(projectFile)) {
      unlink(projectFile, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.warn('Failed to delete project file', err);
        }
      });
    }

    const projectDir = path.join(projectsDir, projectId);
    if (existsSync(projectDir)) {
      fs.rm(projectDir, { recursive: true, force: true }).catch((err) => {
        if (err && err.code !== 'ENOENT') {
          console.warn('Failed to delete project directory', err);
        }
      });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete project', error);
    res.status(500).send('Failed to delete project');
  }
});

const startServer = async () => {
  try {
    await migrateLegacyGalleryMedia();
  } catch (error) {
    console.error('Failed to migrate legacy gallery media', error);
  }

  app.listen(PORT, () => {
    console.log(`Gallery server listening on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start gallery server', error);
});
