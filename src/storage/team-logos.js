const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));

async function getLogoExtension(file) {
  const handle = await fs.open(file.path, 'r');
  let header;
  try {
    header = Buffer.alloc(12);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    header = header.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
  const { mimetype } = file;
  const isPng = mimetype === 'image/png' && header.length >= 8 && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = mimetype === 'image/jpeg' && header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isWebp = mimetype === 'image/webp' && header.length >= 12 &&
    header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
  if (isPng) return '.png';
  if (isJpeg) return '.jpg';
  if (isWebp) return '.webp';
  return null;
}

async function saveTeamLogo(teamId, file, extension) {
  const relativePath = path.posix.join('teams', String(teamId), `${crypto.randomUUID()}${extension}`);
  const filePath = path.resolve(uploadRoot, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.rename(file.path, filePath);
  return relativePath;
}

async function deleteStagedLogo(filePath) {
  if (!filePath) return;
  const stagingRoot = path.join(uploadRoot, '.staging');
  const absolutePath = path.resolve(filePath);
  const fromStaging = path.relative(stagingRoot, absolutePath);
  if (!fromStaging || fromStaging.startsWith('..') || path.isAbsolute(fromStaging)) return;
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function deleteTeamLogo(relativePath) {
  if (!relativePath) return;
  const filePath = path.resolve(uploadRoot, relativePath);
  const fromRoot = path.relative(uploadRoot, filePath);
  if (!fromRoot || fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function logoUrl(relativePath) {
  return relativePath ? `/uploads/${relativePath.split(path.sep).join('/')}` : null;
}

module.exports = { deleteStagedLogo, deleteTeamLogo, getLogoExtension, logoUrl, saveTeamLogo, uploadRoot };
