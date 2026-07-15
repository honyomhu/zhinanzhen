import { NextRequest, NextResponse } from "next/server";
import { parseFormDataFile } from "@/lib/parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await parseFormDataFile(formData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "文件解析失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
