import { join } from "path";
import { randomBytes } from "crypto";

export const saveFile = async (file) => {
  if (!file) return null;
  
  const ext = file.name.split('.').pop();
  const fileName = `${randomBytes(16).toString('hex')}.${ext}`;
  const filePath = join(process.cwd(), "public", "uploads", fileName);
  const fileUrl = `/public/uploads/${fileName}`;

  await Bun.write(filePath, file);

  return fileUrl;
};
