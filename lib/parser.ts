/**
 * 服务端文件解析工具
 * PDF、DOCX 在服务端解析
 * 图片 OCR 在客户端用 Tesseract.js
 */

/**
 * 解析上传的文件，返回文本内容
 * 此函数在 API Route 中调用
 */
export async function parseFile(
  file: File,
  arrayBuffer: ArrayBuffer
): Promise<{ text: string; parseMethod: string }> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".pdf")) {
    return parsePDF(arrayBuffer);
  } else if (fileName.endsWith(".docx")) {
    return parseDOCX(arrayBuffer);
  } else if (fileName.match(/\.(txt|md|csv)$/)) {
    return parseText(arrayBuffer);
  } else {
    throw new Error(`不支持的文件格式: ${file.name}。支持的格式: PDF, DOCX, TXT, MD, CSV`);
  }
}

/**
 * 从 FormData 中提取文件并解析
 */
export async function parseFormDataFile(
  formData: FormData
): Promise<{ text: string; fileName: string; parseMethod: string }> {
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("未找到上传文件");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".pdf")) {
    const result = await parsePDFBuffer(buffer);
    return { text: result.text, fileName: file.name, parseMethod: result.parseMethod };
  } else if (fileName.endsWith(".docx")) {
    const result = await parseDOCXBuffer(buffer);
    return { text: result.text, fileName: file.name, parseMethod: result.parseMethod };
  } else if (fileName.match(/\.(txt|md|csv)$/)) {
    const text = new TextDecoder("utf-8").decode(new Uint8Array(bytes));
    return { text, fileName: file.name, parseMethod: "text" };
  } else if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
    // 图片文件在客户端用 Tesseract.js 处理
    // 服务端返回提示
    throw new Error("图片文件请在客户端粘贴或使用 OCR 功能处理");
  } else {
    throw new Error(`不支持的文件格式: ${file.name}`);
  }
}

// ===== PDF 解析 =====

async function parsePDF(
  arrayBuffer: ArrayBuffer
): Promise<{ text: string; parseMethod: string }> {
  const buffer = Buffer.from(arrayBuffer);
  return parsePDFBuffer(buffer);
}

async function parsePDFBuffer(
  buffer: Buffer
): Promise<{ text: string; parseMethod: string }> {
  try {
    // pdf-parse v3+ 使用 PDFParse 类
    const { PDFParse } = await import("pdf-parse");
    const pdfParser = new PDFParse({ data: buffer });
    // getText 返回 { pages: [...], text: string, total: number }
    const result = await pdfParser.getText();
    const text = result?.text?.trim() || "";
    return { text, parseMethod: "pdf" };
  } catch (error) {
    console.error("PDF 解析失败:", error);
    throw new Error("PDF 解析失败，请确保文件未加密且内容为文本（非扫描件）。如果是扫描件，请使用截图粘贴功能。");
  }
}

// ===== DOCX 解析 =====

async function parseDOCX(
  arrayBuffer: ArrayBuffer
): Promise<{ text: string; parseMethod: string }> {
  const buffer = Buffer.from(arrayBuffer);
  return parseDOCXBuffer(buffer);
}

async function parseDOCXBuffer(
  buffer: Buffer
): Promise<{ text: string; parseMethod: string }> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value?.trim() || "";
    return { text, parseMethod: "docx" };
  } catch (error) {
    console.error("DOCX 解析失败:", error);
    throw new Error("DOCX 解析失败，请检查文件是否损坏。");
  }
}

// ===== 纯文本解析 =====

async function parseText(
  arrayBuffer: ArrayBuffer
): Promise<{ text: string; parseMethod: string }> {
  const text = new TextDecoder("utf-8").decode(new Uint8Array(arrayBuffer));
  return { text: text.trim(), parseMethod: "text" };
}
