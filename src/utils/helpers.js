exports.validateBase64File = function (acceptedFormats, limitSize = 5) {
  return async function (value = "") {
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
    if (fileSizeInMB > limitSize) {
      return false;
    }
    const fileTypeResult = await require("file-type").fileTypeFromBuffer(
      binaryContent
    );
    return fileTypeResult && acceptedFormats.includes(fileTypeResult.ext);
  };
};
