import Quill from "quill";

/**
 * ✅ PatchedImageUploader
 * Chỉ đọc file local (base64), không upload server ngay
 */
class PatchedImageUploader {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;

    // Gán handler mới cho nút image
    this.quill.getModule("toolbar").addHandler("image", this.selectLocalImage.bind(this));
  }

  selectLocalImage() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (file) {
        this.readFileAsBase64(file);
      }
    };
  }

  readFileAsBase64(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.insertToEditor(e.target.result); // Chèn base64
    };
    reader.readAsDataURL(file);
  }

  insertToEditor(url) {
    const range = this.quill.getSelection(true);
    const index = range ? range.index : this.quill.getLength();
    this.quill.insertEmbed(index, "image", url, "user");
    this.quill.setSelection(index + 1);
  }
}

Quill.register("modules/imageUploader", PatchedImageUploader);

export default PatchedImageUploader;
