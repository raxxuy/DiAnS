import { getCompanies } from "@/lib/db/actions/companies";
import { NextResponse } from "next/server";

export async function GET() {
  const companies = await getCompanies();
  return NextResponse.json(companies);
}
