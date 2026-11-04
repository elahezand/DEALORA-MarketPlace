"use client";

import { Dispatch, SetStateAction } from "react";
import { HiOutlinePlus, HiOutlineXMark } from "react-icons/hi2";
import { getUrl } from "@/utils/helper";
import FilePreviewImg from "@/components/shared/FilePreviewImg";
import { sectionClass, sectionTitle } from "./productFormParts";

interface ProductImagesSectionProps {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
}

/* already uploaded images + new files picked for upload (max 10 together) */
export default function ProductImagesSection({ images, setImages, files, setFiles }: ProductImagesSectionProps) {
  return (
    <section className={sectionClass}>
      <h2 className={sectionTitle}>Images</h2>
      <div className="flex flex-wrap gap-3">
        {images.map((src) => (
          <div key={src} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[var(--border)]">
            <img loading="lazy" decoding="async" src={getUrl(src) ?? ""} alt="" className="w-full h-full object-cover" />
            <button aria-label="Remove image"
              type="button"
              onClick={() => setImages((prev) => prev.filter((s) => s !== src))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <HiOutlineXMark />
            </button>
          </div>
        ))}
        {files.map((file, i) => (
          <div key={`${file.name}-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-dashed border-[var(--primary-500)]">
            <FilePreviewImg file={file} alt="" className="w-full h-full object-cover" />
            <button aria-label="Remove new image"
              type="button"
              onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <HiOutlineXMark />
            </button>
          </div>
        ))}
        {images.length + files.length < 10 && (
          <label className="w-24 h-24 rounded-xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-xs text-[var(--foreground-muted)] cursor-pointer hover:bg-[var(--background-soft)]">
            <HiOutlinePlus className="text-lg" />
            Add
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                setFiles((prev) => [...prev, ...picked].slice(0, 10 - images.length));
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </section>
  );
}
