import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");
const ID_DIR = path.join(UPLOAD_ROOT, "id-photos");
const SELFIE_DIR = path.join(UPLOAD_ROOT, "selfies");

for (const dir of [ID_DIR, SELFIE_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  // Never trust the client's declared content-type alone in a real system —
  // this is a demo-level check; production should also sniff magic bytes.
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, or WEBP images are allowed"));
  }
  cb(null, true);
}

function makeStorage(dir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
}

export const uploadIdPhoto = multer({
  storage: makeStorage(ID_DIR),
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

export const uploadSelfie = multer({
  storage: makeStorage(SELFIE_DIR),
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

/** Injects the saved file's public URL into req.body so downstream Zod
 * schemas (which expect idPhotoUrl / photoUrl as a string) validate normally
 * whether the client sent multipart form-data or a JSON body with an
 * already-hosted URL. */
export function attachFileUrl(field: "idPhotoUrl" | "photoUrl", publicPrefix: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file) {
      req.body[field] = `${publicPrefix}/${file.filename}`;
    }
    next();
  };
}
