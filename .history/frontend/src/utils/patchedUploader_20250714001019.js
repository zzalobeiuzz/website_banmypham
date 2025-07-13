import Quill from "quill";

class PatchedImageUploader {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;
    this.quill.getModule("toolbar").addHandler("image", this.selectLocalImage.bind(this));
  }

  selectLocalImage() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (this.options.upload && typeof this.options.upload === "function") {
        this.saveToServer(file);
      }
    };
  }

  saveToServer(file) {
    const range = this.quill.getSelection(true);
    // ⚡ Nếu chưa có range, ép focus về cuối
    if (!range) {
      this.quill.focus();
    }

    this.options.upload(file)
      .then((imageUrl) => {
        this.insertToEditor(imageUrl);
      })
      .catch((error) => {
        console.error("❌ Image upload failed", error);
      });
  }

  insertToEditor(url) {
    const range = this.quill.getSelection(true);
    const index = range ? range.index : this.quill.getLength();
    this.quill.insertEmbed(index, "image", url, "user");
    // Di chuyển con trỏ xuống dưới
    this.quill.setSelection(index + 1);
  }
}

// Đăng ký lại module
Quill.register("modules/imageUploader", PatchedImageUploader);

export default PatchedImageUploader;
