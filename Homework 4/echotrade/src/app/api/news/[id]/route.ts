import { NextRequest, NextResponse } from "next/server";
import { getNewsItem } from "@/lib/db/actions/news";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, locale: string }> }
) {
  const id = parseInt((await params).id);
  const locale = request.nextUrl.searchParams.get("locale") || "en";
  const news = await getNewsItem(id, locale);

  if (!news) {
    return NextResponse.json(null);
  }

  return NextResponse.json(news);
}
