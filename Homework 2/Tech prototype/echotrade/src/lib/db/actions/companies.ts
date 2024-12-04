"use server";

import db from "..";

export async function getCompanyById(id: number) {
  return await db.company.findUnique({
    where: { id }
  });
}

export async function getCompanies() {
  return await db.company.findMany();
}