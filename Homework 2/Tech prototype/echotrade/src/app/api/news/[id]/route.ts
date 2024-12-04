import { NextResponse } from "next/server";
import { getNewsItem } from "@/lib/db/actions/news";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseInt((await params).id);
  const news = await getNewsItem(id);

  if (!news) {
    return NextResponse.json(null);
  }

  return NextResponse.json(news);
}
