const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      ["image", "link"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
      ["insertImageUrl"],
    ],
    handlers: {
      insertImageUrl: function () {
        const url = prompt("Nhập URL hình ảnh:");
        if (url) {
          const range = this.quill.getSelection();
          if (range) {
            this.quill.insertEmbed(range.index, "image", url, "user");
          }
        }
      },
    },
  },
  imageUploader: {
    // ✅ truyền upload function để chuyển base64
    upload: async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // base64 string
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
  },
};
