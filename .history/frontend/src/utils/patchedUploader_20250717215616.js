import Quill from "quill";

class PatchedImageUploader {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options; // cần có options.upload (truyền từ React)
    this.quill.getModule("toolbar").addHandler("image", this.selectLocalImage.bind(this));
  }

  selectLocalImage() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file && this.options.upload) {
        try {
          // 🟢 Gọi hàm upload được truyền vào từ options (ở React)
          const imageUrl = await this.options.upload(file);
          this.insertToEditor(imageUrl);
        } catch (err) {
          console.error("❌ Upload thất bại:", err);
          alert("Không thể chèn ảnh.");
        }
      }
    };
  }

  insertToEditor(url) {
    const range = this.quill.getSelection(true);
    const index = range ? range.index : this.quill.getLength();
    this.quill.insertEmbed(index, "image", url, "user");
    this.quill.setSelection(index + 1);
  }
}

// Đăng ký module với Quill
Quill.register("modules/imageUploader", PatchedImageUploader);

export default PatchedImageUploader;
