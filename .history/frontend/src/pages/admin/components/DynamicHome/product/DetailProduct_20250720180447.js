const imageUrl = product.Image?.startsWith("http")
  ? product.Image
  : `${UPLOAD_BASE}/pictures/${product.Image || "default.jpg"}`;
