exports.validateBase64File = function (acceptedFormats, limitSizeMB = 2.5) {
  return async function (value = "") {
    try {
      const { fileTypeFromBuffer } = await import("file-type");

      const base64ContentArray = value.split(",");
      if (base64ContentArray.length !== 2) {
        return false;
      }
      const base64Content = base64ContentArray[1];
      const binaryContent = Buffer.from(base64Content, "base64");
      if (binaryContent.toString("base64") !== base64Content) {
        return false;
      }
      const fileSizeInMB = binaryContent.length / (1024 * 1024);
      if (fileSizeInMB > limitSizeMB) {
        return false;
      }
      const fileTypeResult = await fileTypeFromBuffer(binaryContent);
      return (
        fileTypeResult &&
        fileTypeResult.ext &&
        acceptedFormats.includes(fileTypeResult.ext)
      );
    } catch (error) {
      return false;
    }
  };
};
