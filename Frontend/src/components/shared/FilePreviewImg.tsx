"use client";

import { useEffect, useState } from "react";

/* shows a local File (before upload) as an <img>, and frees the object url afterwards */
export default function FilePreviewImg({
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

    // eslint-disable-next-line @next/next/no-img-element -- blob: urls can't go through next/image
    return <img loading="lazy" decoding="async" src={url} alt={alt} className={className} />;
}
