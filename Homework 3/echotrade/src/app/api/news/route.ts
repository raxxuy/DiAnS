import { NextResponse } from "next/server";
import { getNews } from "@/lib/db/actions/news";

export async function GET() {
  const news = await getNews();
  return NextResponse.json(news);
}
