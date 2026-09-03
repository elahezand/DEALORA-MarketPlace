"use client";

import React, { useEffect, useRef, useState } from "react";
import { GrGallery } from "react-icons/gr";
import { FaPlus as FaPlusIcon } from "react-icons/fa";
import { useFormikContext } from "formik";

const MAX_IMAGES = 4;

function ImagePreview({
    file,
    alt,
    className,
}: {
    file: File;
    alt: string;
    className?: string;
}) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!(file instanceof File)) {
            setUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!url) return null;

    return <img src={url} alt={alt} className={className} />;
}

export default function StepMedia() {
    const { values, setFieldValue, setFieldTouched } = useFormikContext<any>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const images: File[] = values?.snapshot?.images || [];

    const handleFocus = () => {
        setFieldTouched("snapshot.images", true);
    };

    const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const fileArr = Array.from(files);
        const updated = [...images, ...fileArr].slice(0, MAX_IMAGES);
        setFieldValue("snapshot.images", updated);
        setFieldTouched("snapshot.images", true);

        e.target.value = "";
    };

    const handleRemoveImage = (idx: number) => {
        const updated = images.filter((_: File, i: number) => i !== idx);
        setFieldValue("snapshot.images", updated);
    };

    const hasError = values?.snapshot?.images && images.length === 0;

    return (
        <div className="space-y-6 antialiased">
            <div className="flex items-center justify-between p-4 rounded-2xl border transition-colors duration-200"
                 style={{
                     backgroundColor: "var(--background-soft)",
                     borderColor: "var(--border)"
                 }}>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl shadow-sm transition-colors duration-200"
                         style={{
                             backgroundColor: "var(--card-solid)",
                             color: "var(--primary-500)"
                         }}>
                        <GrGallery size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold tracking-tight transition-colors duration-200"
                            style={{ color: "var(--foreground)" }}>
                            Product Images
                        </h3>
                        <p className="text-xs font-medium mt-0.5 transition-colors duration-200"
                           style={{ color: "var(--foreground-muted)" }}>
                            Upload beautiful photos to attract buyers
                        </p>
                    </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-colors duration-200"
                     style={{
                         backgroundColor: "var(--border)",
                         color: "var(--foreground-muted)"
                     }}>
                    {images.length} / {MAX_IMAGES}
                </div>
            </div>

            {hasError && (
                <div className="flex items-center gap-2 p-4 rounded-xl text-sm font-medium border transition-colors duration-200"
                     style={{
                         backgroundColor: "var(--destructive-bg)",
                         borderColor: "var(--destructive)",
                         color: "var(--destructive)"
                     }}>
                    <span>📍</span>
                    <p style={{ color: "var(--destructive)" }}>Please add at least one image to proceed</p>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((file: File, idx: number) => {
                    const isMain = idx === 0;
                    return (
                        <div
                            key={idx}
                            className="relative group aspect-square rounded-2xl overflow-hidden border transition-all duration-300"
                            style={{
                                borderColor: isMain ? "var(--ring)" : "var(--border)",
                                boxShadow: isMain ? "var(--focus-ring-shadow)" : "var(--card-shadow-2)"
                            }}
                        >
                            <ImagePreview
                                file={file}
                                alt={`product-preview-${idx}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/30 transition-all duration-300" />

                            <button
                                type="button"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:scale-105"
                                style={{ backgroundColor: "var(--destructive)" }}
                                onClick={() => handleRemoveImage(idx)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {isMain && (
                                <span className="absolute bottom-2.5 left-2.5 text-[9px] font-black tracking-widest backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm border uppercase transition-colors duration-200"
                                      style={{
                                          backgroundColor: "var(--card-solid)",
                                          color: "var(--label-color)",
                                          borderColor: "var(--border)"
                                      }}>
                                    👑 Main Photo
                                </span>
                            )}
                        </div>
                    );
                })}

                {images.length < MAX_IMAGES && (
                    <div
                        className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group relative"
                        style={{
                            borderColor: "var(--border-strong)",
                            backgroundColor: "var(--background-soft)"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--ring)";
                            e.currentTarget.style.backgroundColor = "hsl(from var(--primary-500) h s l / 0.04)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-strong)";
                            e.currentTarget.style.backgroundColor = "var(--background-soft)";
                        }}
                        onClick={() => {
                            handleFocus();
                            fileInputRef.current?.click();
                        }}
                    >
                        <div className="p-3 rounded-xl border shadow-sm group-hover:scale-105 transition-all duration-300"
                             style={{
                                 backgroundColor: "var(--card-solid)",
                                 borderColor: "var(--border)",
                                 color: "var(--primary-500)"
                             }}>
                            <FaPlusIcon size={18} />
                        </div>
                        <span className="text-xs font-bold mt-3 transition-colors duration-200 group-hover:text-[var(--primary-600)]"
                              style={{ color: "var(--foreground-muted)" }}>
                            Add Photo
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleAddImage}
                            disabled={images.length >= MAX_IMAGES}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}