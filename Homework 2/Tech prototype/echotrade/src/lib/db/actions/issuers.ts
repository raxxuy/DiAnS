"use server";

import db from "..";

export async function getIssuers() {
  const issuers = await db.issuer.findMany();
  return issuers;
}

export async function getIssuerById(id: number) {
  const issuer = await db.issuer.findUnique({ where: { id } });
  return issuer;
}

export async function getIssuerByCode(code: string) {
  const issuer = await db.issuer.findUnique({ where: { code } });
  return issuer;
}

export async function getIssuerHistory(issuerId: number) {
  const history = await db.stockhistory.findMany({ where: { issuer_id: issuerId } });
  return history;
}

