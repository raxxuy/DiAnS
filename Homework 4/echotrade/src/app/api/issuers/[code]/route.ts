import { getIssuerByCode } from "@/lib/db/actions/issuers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const code = (await params).code;
  const issuer = await getIssuerByCode(code);

  if (!issuer) {
    return NextResponse.json(null);
  }

  return NextResponse.json(issuer);
}
