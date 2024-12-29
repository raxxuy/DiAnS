import { getCompanies } from "@/lib/db/actions/companies";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") || "en";
  const companies = await getCompanies(locale);
  return NextResponse.json(companies);
}
