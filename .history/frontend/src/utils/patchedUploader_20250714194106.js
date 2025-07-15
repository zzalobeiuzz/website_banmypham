import Quill from "quill";

/**
 * ✅ PatchedImageUploader
 * Dùng object URL (không convert base64), giữ được file gốc để submit
 */
class PatchedImageUploader {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;

    // Gán handler mới cho nút image
    this.quill.getModule("toolbar").addHandler("image", this.selectLocalImage.bind(this));

    // Tạo mảng lưu file
    if (!this.quill.localFiles) {
      this.quill.localFiles = [];
    }
  }

  selectLocalImage() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (file) {
        this.insertToEditor(file);
      }
    };
  }

  insertToEditor(file) {
    const localUrl = URL.createObjectURL(file);
    const range = this.quill.getSelection(true);
    const index = range ? range.index : this.quill.getLength();
    this.quill.insertEmbed(index, "image", localUrl, "user");
    this.quill.setSelection(index + 1);

    // Lưu lại file để submit
    this.quill.localFiles.push(file);
  }
}

Quill.register("modules/imageUploader", PatchedImageUploader);

export default PatchedImageUploader;
