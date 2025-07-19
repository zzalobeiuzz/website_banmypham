import Quill from "quill";

class PatchedImageUploader {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options; // cần có options.upload để truyền hàm upload
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
          const imageUrl = await this.options.upload(file); // upload lên server
          this.insertToEditor(imageUrl); // chèn URL ảnh vào editor
        } catch (err) {
          console.error("❌ Lỗi khi upload ảnh:", err);
          alert("Không thể upload ảnh");
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

Quill.register("modules/imageUploader", PatchedImageUploader);

export default PatchedImageUploader;
