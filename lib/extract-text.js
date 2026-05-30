/**
 * Extract text content from uploaded file buffer based on MIME type
 * Supports: PDF (.pdf), Word (.docx), and plain text (.txt)
 *
 * @param {Buffer} buffer - File content as a Buffer
 * @param {string} mimeType - MIME type of the file
 * @param {string} fileName - Original filename (fallback for type detection)
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromFile(buffer, mimeType, fileName = "") {
  const ext = fileName.split(".").pop()?.toLowerCase();

  // PDF — using pdfjs-dist directly for reliable extraction
  if (mimeType === "application/pdf" || ext === "pdf") {
    try {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const uint8 = new Uint8Array(buffer);
      const doc = await pdfjsLib.getDocument({ data: uint8, useSystemFonts: true }).promise;

      let fullText = "";
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      const text = fullText.trim();
      if (!text) {
        throw new Error(
          "No readable text found in PDF. The PDF may be image-based or scanned."
        );
      }
      return text;
    } catch (err) {
      if (err.message.includes("No readable text")) throw err;
      throw new Error(`Failed to parse PDF: ${err.message}`);
    }
  }

  // Word (.docx) — using mammoth
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    try {
      const mammothModule = await import("mammoth");
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value?.trim();
      if (!text) {
        throw new Error("No readable text found in the Word document.");
      }
      return text;
    } catch (err) {
      if (err.message.includes("No readable text")) throw err;
      throw new Error(`Failed to parse Word document: ${err.message}`);
    }
  }

  // Legacy Word (.doc) — mammoth doesn't support .doc
  if (mimeType === "application/msword" || ext === "doc") {
    throw new Error(
      "Legacy .doc format is not supported. Please convert your file to .docx or .pdf and try again."
    );
  }

  // Plain text (.txt, .text, .md, etc.)
  if (
    mimeType?.startsWith("text/") ||
    ext === "txt" ||
    ext === "text" ||
    ext === "md"
  ) {
    const text = buffer.toString("utf-8").trim();
    if (!text) {
      throw new Error("The text file appears to be empty.");
    }
    return text;
  }

  throw new Error(
    `Unsupported file type: ${mimeType || ext}. Please upload a PDF, Word (.docx), or text (.txt) file.`
  );
}

/**
 * Extract text content from a remote URL (e.g. Cloudinary)
 *
 * @param {string} url - URL of the file to extract text from
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromUrl(url) {
  if (!url) throw new Error("No URL provided for extraction");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
  }

  const mimeType = response.headers.get("content-type") || "";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Extract filename from URL to help with extension detection
  let fileName = "";
  try {
    fileName = new URL(url).pathname.split('/').pop() || "";
  } catch (e) {
    // If URL parsing fails, ignore
  }

  return extractTextFromFile(buffer, mimeType, fileName);
}
