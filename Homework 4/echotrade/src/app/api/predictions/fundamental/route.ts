import { getIssuerSentiment } from "@/lib/predictions/fundamental";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const issuer_id = searchParams.get("issuer_id");

  if (!issuer_id) {
    return NextResponse.json({ error: "Missing issuer_id" }, { status: 400 });
  }

  const sentiment = await getIssuerSentiment(parseInt(issuer_id));

  if (!sentiment) {
    return NextResponse.json({ error: "No sentiment data found" }, { status: 404 });
  }

  return NextResponse.json(sentiment);
} 