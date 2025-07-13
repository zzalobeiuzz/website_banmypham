import Quill from "quill"; // 👉 Import Quill chính

/**
 * ✅ Class PatchedImageUploader
 * Mục đích: thay thế module imageUploader gốc (quill-image-uploader) để tránh lỗi 'ops' null, lỗi mất chữ, lỗi range.
 */
class PatchedImageUploader {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;

    // 🔥 Gắn handler mới cho nút image trong toolbar
    this.quill.getModule("toolbar").addHandler("image", this.selectLocalImage.bind(this));
  }

  /**
   * 👉 Hàm mở dialog chọn file
   */
  selectLocalImage() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      // ✅ Kiểm tra function upload có tồn tại không
      if (this.options.upload && typeof this.options.upload === "function") {
        this.saveToServer(file);
      }
    };
  }

  /**
   * 👉 Gửi file lên server (gọi function upload do mình config trong modules)
   */
  saveToServer(file) {
    // ✅ Lấy range hiện tại (vị trí con trỏ)
    const range = this.quill.getSelection(true);

    // ⚡ Nếu chưa có range (chưa focus), ép focus về cuối
    if (!range) {
      this.quill.focus();
    }

    // ✅ Gọi function upload
    this.options.upload(file)
      .then((imageUrl) => {
        this.insertToEditor(imageUrl);
      })
      .catch((error) => {
        console.error("❌ Image upload failed", error);
      });
  }

  /**
   * 👉 Insert ảnh vào editor tại vị trí con trỏ
   */
  insertToEditor(url) {
    const range = this.quill.getSelection(true);
    // ✅ Nếu range có, dùng index; không có thì insert cuối
    const index = range ? range.index : this.quill.getLength();

    // ✅ Insert image embed
    this.quill.insertEmbed(index, "image", url, "user");

    // ✅ Di chuyển con trỏ xuống dưới sau khi insert
    this.quill.setSelection(index + 1);
  }
}

// ✅ Đăng ký lại module imageUploader với Quill (override module gốc)
Quill.register("modules/imageUploader", PatchedImageUploader);

export default PatchedImageUploader;
