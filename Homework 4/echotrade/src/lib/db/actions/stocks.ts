"use server";

import db from "..";

export async function getStockHistories() {
  const histories = await db.stockhistory.findMany();
  return histories;
}

export async function getStockHistoryByIssuerId(issuerId: number) {
  const history = await db.stockhistory.findMany({ where: { issuer_id: issuerId } });
  return history;
}