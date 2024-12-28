import aiohttp
import asyncio
import time
from datetime import datetime, timedelta
from bs4 import BeautifulSoup, SoupStrainer
from multiprocessing import Pool
import utils
from db import Database


# Timer decorator to measure execution time
def timer(func):
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        result = await func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} completed in {end_time - start_time:.2f} seconds.")
        return result

    return wrapper


# Filter 1
@timer
async def fetch_issuers():
    url = "https://www.mse.mk/en/stats/current-schedule"
    excluded = ['CKB', 'SNBTO', 'TTK']
    issuers = []

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            response_text = await response.text()
            soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("tbody"))

            for row in soup.select("tr"):
                code = row.select("td")[0].text.strip()
                if code not in excluded and not any(char.isdigit() for char in code):
                    issuers.append(code)

            return issuers


# Filter 2
@timer
async def get_last_available_date(db, issuer_code):
    return await db.get_last_available_date(issuer_code)


# Filter 3
@timer
async def fill_in_missing_data(db, issuer_code, last_date):
    if not last_date:
        last_date = (datetime.now() - timedelta(days=3650)).date()

    found = await db.find_issuer_by_code(issuer_code)
    stock_history = await utils.fetch_stock_history(issuer_code, last_date)

    if stock_history:
        if found is None:
            company_data = await utils.fetch_company(issuer_code)
            found = await db.assign_issuer(issuer_code, company_data)

        entries = [
            [found, datetime.strptime(stock_entry[0].replace(".", "/"), "%d/%m/%Y").date()] + stock_entry[1:]
            for stock_entry in stock_history
        ]

        await db.batch_add_stock_entries(entries)


def sync_process_issuer(db_params, issuer_code):
    db = Database(**db_params)

    async def fetch_last_date_and_fill():
        await db.connect()

        last_date = await get_last_available_date(db, issuer_code)  # Filter 2
        await fill_in_missing_data(db, issuer_code, last_date)  # Filter 3

        await db.close()

    asyncio.run(fetch_last_date_and_fill())


@timer
async def main():
    db_params = {"user": "postgres", "password": "postgres", "database": "DB"}
    db = Database(**db_params)
    await db.connect()
    await db.create_tables()
    await db.close()

    issuers = await fetch_issuers()  # Filter 1

    with Pool(processes=12) as pool:
        # Run filter 2 and 3 for each issuer in parallel
        pool.starmap(sync_process_issuer, [(db_params, issuer) for issuer in issuers])


if __name__ == "__main__":
    asyncio.run(main())
