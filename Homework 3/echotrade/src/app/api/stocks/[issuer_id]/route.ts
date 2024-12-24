import { NextResponse } from "next/server";
import { getStockHistoryByIssuerId } from "@/lib/db/actions/stocks";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ issuer_id: string }> }
) {
  const issuer_id = parseInt((await params).issuer_id);
  const histories = await getStockHistoryByIssuerId(issuer_id);
  return NextResponse.json(histories);
}
