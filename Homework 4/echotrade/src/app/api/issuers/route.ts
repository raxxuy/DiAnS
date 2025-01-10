import { getIssuers } from "@/lib/db/actions/issuers";
import { NextResponse } from "next/server";

export async function GET() {
  const issuers = await getIssuers();
  return NextResponse.json(issuers);
}
