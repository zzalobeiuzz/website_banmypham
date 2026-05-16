// ======== Component cho phép người dùng chỉnh sửa ảnh đại diện ============= */
import React, { useEffect, useMemo, useRef, useState } from "react";

const VIEW_SIZE = 320;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const AvatarCropEditor = ({ open, source, onClose, onApply }) => {
  const dragStateRef = useRef(null);
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !source) return undefined;

    let isCancelled = false;
    setLoading(true);
    setError("");
    setImage(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (isCancelled) return;
      setImage(img);
      setLoading(false);
    };
    img.onerror = () => {
      if (isCancelled) return;
      setError("Không thể tải ảnh để chỉnh sửa.");
      setLoading(false);
    };
    img.src = source;

    return () => {
      isCancelled = true;
    };
  }, [open, source]);

  const geometry = useMemo(() => {
    if (!image) return null;

    const baseScale = Math.max(VIEW_SIZE / image.naturalWidth, VIEW_SIZE / image.naturalHeight);
    const displayScale = baseScale * zoom;
    const displayWidth = image.naturalWidth * displayScale;
    const displayHeight = image.naturalHeight * displayScale;
    const limitX = Math.max(0, (displayWidth - VIEW_SIZE) / 2);
    const limitY = Math.max(0, (displayHeight - VIEW_SIZE) / 2);
    const safeOffsetX = clamp(offset.x, -limitX, limitX);
    const safeOffsetY = clamp(offset.y, -limitY, limitY);

    return {
      baseScale,
      displayScale,
      displayWidth,
      displayHeight,
      limitX,
      limitY,
      offsetX: safeOffsetX,
      offsetY: safeOffsetY,
    };
  }, [image, offset.x, offset.y, zoom]);

  useEffect(() => {
    if (!geometry) return;

    if (geometry.offsetX !== offset.x || geometry.offsetY !== offset.y) {
      setOffset({ x: geometry.offsetX, y: geometry.offsetY });
    }
  }, [geometry, offset.x, offset.y]);

  const handlePointerDown = (event) => {
    if (!image || !geometry) return;
    event.preventDefault();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: geometry.offsetX,
      originY: geometry.offsetY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId || !geometry) return;

    const nextX = clamp(dragState.originX + (event.clientX - dragState.startX), -geometry.limitX, geometry.limitX);
    const nextY = clamp(dragState.originY + (event.clientY - dragState.startY), -geometry.limitY, geometry.limitY);
    setOffset({ x: nextX, y: nextY });
  };

  const stopDragging = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleApply = () => {
    if (!image || !geometry) return;

    const canvas = document.createElement("canvas");
    canvas.width = VIEW_SIZE;
    canvas.height = VIEW_SIZE;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setError("Không thể tạo canvas để cắt ảnh.");
      return;
    }

    try {
      const left = (VIEW_SIZE - geometry.displayWidth) / 2 + geometry.offsetX;
      const top = (VIEW_SIZE - geometry.displayHeight) / 2 + geometry.offsetY;
      const sourceX = Math.max(0, -left / geometry.displayScale);
      const sourceY = Math.max(0, -top / geometry.displayScale);
      const sourceWidth = VIEW_SIZE / geometry.displayScale;
      const sourceHeight = VIEW_SIZE / geometry.displayScale;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, VIEW_SIZE, VIEW_SIZE);
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        VIEW_SIZE,
        VIEW_SIZE,
      );

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      onApply(dataUrl);
    } catch (saveError) {
      setError("Ảnh này không cho phép cắt trực tiếp trong trình duyệt.");
    }
  };

  if (!open) return null;

  return (
    <div className="avatar-editor-overlay" onClick={onClose}>
      <div className="avatar-editor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="avatar-editor-header">
          <div>
            <div className="avatar-editor-title">Chỉnh sửa ảnh đại diện</div>
            <div className="avatar-editor-subtitle">Kéo để canh khung, dùng thanh trượt để zoom.</div>
          </div>
          <button type="button" className="avatar-editor-close" onClick={onClose}>
            Đóng
          </button>
        </div>

        <div className="avatar-editor-body">
          <div className="avatar-editor-stage-wrap">
            <div
              className={`avatar-editor-stage ${loading ? "is-loading" : ""}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onPointerLeave={stopDragging}
            >
              {image && geometry && (
                <img
                  src={source}
                  alt="avatar crop source"
                  className="avatar-editor-image"
                  draggable={false}
                  style={{
                    width: `${geometry.displayWidth}px`,
                    height: `${geometry.displayHeight}px`,
                    left: `calc(50% - ${geometry.displayWidth / 2}px + ${geometry.offsetX}px)`,
                    top: `calc(50% - ${geometry.displayHeight / 2}px + ${geometry.offsetY}px)`,
                  }}
                />
              )}

              {!image && loading && <div className="avatar-editor-status">Đang tải ảnh...</div>}
              {!image && !loading && error && <div className="avatar-editor-status error">{error}</div>}

              <div className="avatar-editor-mask" />
              <div className="avatar-editor-frame" />
            </div>
          </div>

          <div className="avatar-editor-controls">
            <label className="avatar-editor-slider-label">
              <span>Thu phóng</span>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step="0.01"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                disabled={!image}
              />
            </label>

            <div className="avatar-editor-hint">Ảnh sẽ được lưu theo phần đang hiển thị ở khung tròn.</div>

            {error && <div className="avatar-editor-error">{error}</div>}

            <div className="avatar-editor-actions">
              <button type="button" className="btn-cancel" onClick={handleReset} disabled={!image}>
                Đặt lại
              </button>
              <button type="button" className="btn-cancel" onClick={onClose}>
                Hủy
              </button>
              <button type="button" className="btn-confirm" onClick={handleApply} disabled={!image || loading}>
                Cắt và dùng ảnh này
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropEditor;