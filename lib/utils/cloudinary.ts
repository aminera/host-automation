import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type UploadFolder = "contracts" | "guests" | "signatures";

// PDFs must use resource_type "raw" to be publicly downloadable.
// Images (signatures, guest docs) use "image".
const resourceTypeMap: Record<UploadFolder, "raw" | "image"> = {
  contracts: "raw",
  guests: "image",
  signatures: "image",
};

/**
 * Upload a Buffer or base64 data URI to Cloudinary.
 * Returns the secure URL.
 */
export async function uploadToCloudinary(
  data: Buffer | string,
  folder: UploadFolder,
  fileName: string
): Promise<string> {
  const isContract = folder === "contracts";

  const source =
    Buffer.isBuffer(data)
      ? `data:${isContract ? "application/pdf" : "application/octet-stream"};base64,${data.toString("base64")}`
      : data;

  // Ensure contracts always have .pdf extension in the public_id
  const publicId = isContract && !fileName.endsWith(".pdf")
    ? `${fileName}.pdf`
    : fileName;

  const result = await cloudinary.uploader.upload(source, {
    folder,
    public_id: publicId,
    overwrite: true,
    resource_type: resourceTypeMap[folder],
    format: isContract ? "pdf" : undefined,
    access_mode: "public",
    type: "upload",
  });

  return result.secure_url;
}
