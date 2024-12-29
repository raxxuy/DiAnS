import { NextResponse, NextRequest } from "next/server";
import { getNews } from "@/lib/db/actions/news";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") || "en";
  const news = await getNews(locale);
  return NextResponse.json(news);
}

