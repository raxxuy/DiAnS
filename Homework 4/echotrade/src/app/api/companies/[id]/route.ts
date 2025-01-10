import { getCompanyById } from "@/lib/db/actions/companies";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseInt((await params).id);
  const locale = request.nextUrl.searchParams.get("locale") || "en";
  const company = await getCompanyById(id, locale);
  return NextResponse.json(company);
}
