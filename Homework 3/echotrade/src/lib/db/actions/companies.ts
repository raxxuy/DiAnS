"use server";

import db from "..";

export async function getCompanyById(id: number, locale: string) {
  if (locale === "mk") {
    return await db.company_mk.findUnique({ where: { id } });
  }

  return await db.company.findUnique({ where: { id } });
}

export async function getCompanies(locale: string) {
  if (locale === "mk") {
    return await db.company_mk.findMany();
  }
  return await db.company.findMany(); 
}