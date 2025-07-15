import Quill from "quill"; // 👉 Import Quill chính

/**
 * ✅ Class PatchedImageUploader
 * Dùng để:
 * - Tùy biến lại module image uploader gốc (ví dụ quill-image-uploader) theo cách riêng
 * - Fix các lỗi liên quan đến range null, lỗi mất chữ khi chèn ảnh, hoặc lỗi 'ops' null
 * - Cho phép tự định nghĩa logic upload ảnh (gửi lên server), thay vì dùng uploader mặc định
 */
class PatchedImageUploader {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;

    // 🔥 Gắn handler mới cho nút image trong toolbar của Quill
    this.quill.getModule("toolbar").addHandler("image", this.selectLocalImage.bind(this));
  }

  /**
   * 👉 Hàm mở dialog chọn file local
   * Khi user bấm vào nút ảnh trên toolbar, sẽ gọi hàm này
   */
  selectLocalImage() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      // ✅ Nếu có function upload được truyền từ options
      if (this.options.upload && typeof this.options.upload === "function") {
        this.saveToServer(file);
      }
    };
  }

  /**
   * 👉 Gửi file ảnh lên server bằng cách gọi function upload (do mình config)
   */
  saveToServer(file) {
    // ✅ Lấy vị trí hiện tại của con trỏ
    const range = this.quill.getSelection(true);

    // ⚡ Nếu chưa có range (chưa focus), ép focus về cuối
    if (!range) {
      this.quill.focus();
    }

    // ✅ Gọi function upload
    this.options.upload(file)
      .then((imageUrl) => {
        this.insertToEditor(imageUrl); // Nếu upload xong, chèn ảnh vào editor
      })
      .catch((error) => {
        console.error("❌ Image upload failed", error);
      });
  }

  /**
   * 👉 Chèn ảnh vào editor tại vị trí con trỏ
   * @param {string} url - Đường dẫn URL của ảnh sau khi upload
   */
  insertToEditor(url) {
    const range = this.quill.getSelection(true);
    // ✅ Nếu có range, lấy index đó; nếu không thì chèn vào cuối
    const index = range ? range.index : this.quill.getLength();

    // ✅ Chèn ảnh
    this.quill.insertEmbed(index, "image", url, "user");

    // ✅ Đẩy con trỏ xuống dưới sau ảnh
    this.quill.setSelection(index + 1);
  }
}

// ✅ Đăng ký lại module imageUploader với Quill (override module gốc)
Quill.register("modules/imageUploader", PatchedImageUploader);

export default PatchedImageUploader;
