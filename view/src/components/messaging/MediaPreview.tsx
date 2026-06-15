interface MediaPreviewProps { urls: string[]; }

export default function MediaPreview({ urls }: MediaPreviewProps) {
  if (!urls?.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {urls.map((url, i) => (
        <img key={i} src={url} alt={`attachment-${i}`} className="max-h-40 max-w-[200px] rounded object-cover" loading="lazy" />
      ))}
    </div>
  );
}
