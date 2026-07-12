import { useRef, useState } from "react";
import { IconUpload, IconTrash, IconAlertCircle } from "../../../components/icons";
import { resolveMediaUrl } from "../../../api/properties";

const MAX_PHOTOS = 20;
const MIN_PHOTOS = 5;
const MAX_SIZE_MB = 5;

export default function StepPhotos({ data, errors, onChange }) {
  const inputRef = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [sizeError, setSizeError] = useState("");

  function handleFiles(fileList) {
    setSizeError("");
    const incoming = Array.from(fileList);
    const room = MAX_PHOTOS - data.files.length;
    if (room <= 0) return;

    const oversized = incoming.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      setSizeError(`Max ${MAX_SIZE_MB}MB per photo. "${oversized.name}" is too large.`);
    }

    const accepted = incoming.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024).slice(0, room);
    const newFiles = accepted.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));

    const files = [...data.files, ...newFiles];
    const coverId = data.coverId || files[0]?.id || null;
    onChange({ ...data, files, coverId });
  }

  function removePhoto(id) {
    const files = data.files.filter((f) => f.id !== id);
    const coverId = data.coverId === id ? files[0]?.id || null : data.coverId;
    onChange({ ...data, files, coverId });
  }

  function setCover(id) {
    onChange({ ...data, coverId: id });
  }

  function onDragStart(idx) {
    setDragIdx(idx);
  }

  function onDragOver(e, idx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const files = [...data.files];
    const [moved] = files.splice(dragIdx, 1);
    files.splice(idx, 0, moved);
    setDragIdx(idx);
    onChange({ ...data, files });
  }

  return (
    <div>
      <div className="builder-panel-head">
        <h2>Add photos of your place</h2>
        <p>
          Upload {MIN_PHOTOS}–{MAX_PHOTOS} photos. Drag tiles to reorder, and choose one as your cover photo.
        </p>
      </div>

      <div className="photo-grid">
        {data.files.map((f, idx) => (
          <div
            key={f.id}
            className="photo-tile"
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragEnd={() => setDragIdx(null)}
          >
            <img src={resolveMediaUrl(f.url)} alt={f.name} />
            {data.coverId === f.id && <span className="photo-tile-cover-badge">Cover</span>}
            <button type="button" className="photo-tile-remove" onClick={() => removePhoto(f.id)} aria-label="Remove photo">
              <IconTrash width={14} height={14} />
            </button>
            {data.coverId !== f.id && (
              <button type="button" className="photo-tile-setcover" onClick={() => setCover(f.id)}>
                Set as cover
              </button>
            )}
          </div>
        ))}

        {data.files.length < MAX_PHOTOS && (
          <button type="button" className="photo-upload-tile" onClick={() => inputRef.current?.click()}>
            <IconUpload />
            Add photo
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </button>
        )}
      </div>

      <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "space-between" }}>
        <span className="char-counter" style={{ textAlign: "left" }}>
          {data.files.length} / {MAX_PHOTOS} photos
        </span>
      </div>

      {sizeError && (
        <span className="field-error" role="alert">
          <IconAlertCircle width={14} height={14} /> {sizeError}
        </span>
      )}
      {errors.files && (
        <span className="field-error" role="alert">
          <IconAlertCircle width={14} height={14} /> {errors.files}
        </span>
      )}
    </div>
  );
}
