export const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("文件转 base64 失败"));
        return;
      }

      const [, base64 = ""] = result.split(",");
      resolve(base64);
    };

    reader.onerror = () => reject(reader.error ?? new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
