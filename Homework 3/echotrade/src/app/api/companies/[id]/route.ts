import { getCompanyById } from "@/lib/db/actions/companies";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseInt((await params).id);
  const company = await getCompanyById(id);
  return NextResponse.json(company);
}
