import aiohttp
import asyncio
import time
from datetime import datetime, timedelta
from bs4 import BeautifulSoup, SoupStrainer
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
    bonds = ['CKB', 'SNBTO', 'TTK'] # Excluded issuers
    url = "https://www.mse.mk/en/stats/symbolhistory/ADIN"

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:

            response_text = await response.text()
            strainer = SoupStrainer("select")
            soup = BeautifulSoup(response_text, "lxml", parse_only=strainer)

            issuers = []
            options = soup.select("select > option")

            for option in options:
                code = option.get("value")
                if code not in bonds and not any(char.isdigit() for char in code):
                    issuers.append(code)

            return issuers


# Filter 2
@timer
async def get_last_available_date(issuer_code):
    found = await db.find_issuer_by_code(issuer_code)

    if found is None:
        company_data = await utils.fetch_company(issuer_code)
        stock_history = await utils.fetch_stock_history(issuer_code)

        company_id = await db.add_company(*company_data) if type(company_data) is list else await db.add_company(company_data)
        issuer_id = await db.add_issuer(issuer_code, company_id)

        if stock_history:
            entries = [
                [issuer_id, datetime.strptime(stock_entry[0], "%m/%d/%Y").date()] +
                [float(el.replace(",", "")) for el in stock_entry[1:6]] +
                [int(el.replace(",", "")) for el in stock_entry[6:]]
                for stock_entry in reversed(stock_history)
            ]

            await db.batch_add_stock_entries(entries)

            return entries[-1][1]

    return await db.get_last_available_date(issuer_code)


# Filter 3
@timer
async def fill_in_missing_data(issuer_code, date):
    if date is None:
        return

    stock_entry = (await db.find_stock_entry(issuer_code, date))[1:]
    start_date = stock_entry[1] + timedelta(days=1)
    end_date = datetime.now().date()
    days = (end_date - start_date).days

    entries = [
        [stock_entry[0], start_date + timedelta(days=i)] + stock_entry[2:]
        for i in range(days + 1)
    ]

    await db.batch_add_stock_entries(entries)


@timer
async def main():
    await db.connect()
    await db.create_tables()

    issuers = await fetch_issuers() # Filter 1

    for issuer in issuers:
        last_date = await get_last_available_date(issuer) # Filter 2
        await fill_in_missing_data(issuer, last_date) # Filter 3

    await db.close()

if __name__ == "__main__":
    db = Database(user="postgres", password="postgres", database="DB")

    asyncio.run(main())
