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
    url = "https://www.mse.mk/en/stats/current-schedule"
    excluded = ['CKB', 'SNBTO', 'TTK'] # Excluded issuers (Bonds)
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
async def get_last_available_date(issuer_code):
    found = await db.find_issuer_by_code(issuer_code)

    if found is None:
        company_data = await utils.fetch_company(issuer_code)
        stock_history = await utils.fetch_stock_history(issuer_code)

        if stock_history:
            issuer_id = await db.assign_issuer(issuer_code, company_data)

            entries = [
                [issuer_id, datetime.strptime(stock_entry[0].replace(".", "/"), "%d/%m/%Y").date()] + stock_entry[1:]
                for stock_entry in reversed(stock_history)
            ]

            await db.batch_add_stock_entries(entries)

            return entries[-1][1]

    return await db.get_last_available_date(issuer_code)


# Filter 3
@timer
async def fill_in_missing_data(issuer_code, last_date):
    if not last_date:
        return

    stock_entry = (await db.find_stock_entry(issuer_code, last_date))[1:]
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

    # Pipe section
    try:
        issuers = await fetch_issuers() # Filter 1

        semaphore = asyncio.Semaphore(5)

        async def sem_task(issuer):
            async with semaphore:
                last_date = await get_last_available_date(issuer) # Filter 2
                await fill_in_missing_data(issuer, last_date) # Filter 3

        tasks = [sem_task(issuer) for issuer in issuers]
        await asyncio.gather(*tasks)

    finally:
        await db.close()

if __name__ == "__main__":
    db = Database(user="postgres", password="postgres", database="DB")

    asyncio.run(main())
