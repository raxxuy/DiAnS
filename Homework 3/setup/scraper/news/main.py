from datetime import datetime
from multiprocessing import Pool
import aiohttp
import asyncio
import time
from bs4 import BeautifulSoup, SoupStrainer
import random
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
async def fetch_links():
    links = []
    for i in range(1, 40):
        url = f"https://www.mse.mk/en/news/latest/{i}"

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                response_text = await response.text()
                soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("div", {"id": "news-content"}))
                
                for link in soup.select("a"):
                    if link.select_one("b"):
                        links.append((link.get("href"), link.get("href").replace("en/", "mk/")))  

    return links


# Filter 2
@timer
async def fetch_news(link):
    url = f"https://www.mse.mk{link}"

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            response_text = await response.text()
            soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("main"))
            title = soup.select_one(".col-md-9").text.strip()
            date = soup.select_one(".news-date").text.strip()
            content = [p.text.strip() for p in soup.select("#content > p")]

            if content == ["/"]:
                return None

            return title, date, content


# Filter 3
@timer
async def add_missing_news(db, news, news_mk):
    if news is None:
        return

    title, date, content = news
    title_mk, date_mk, content_mk = news_mk

    parsed_date = datetime.strptime(date, "%A, %B %d, %Y").date()
    shared_id = await db.add_news(title, parsed_date, content, "en")

    parsed_date_mk = parse_macedonian_date(date_mk)
    await db.add_news_mk(shared_id, title_mk, parsed_date_mk, content_mk)


def parse_macedonian_date(date):
    mk_months = {
        'јануари': '01', 'февруари': '02', 'март': '03', 'април': '04',
        'мај': '05', 'јуни': '06', 'јули': '07', 'август': '08',
        'септември': '09', 'октомври': '10', 'ноември': '11', 'декември': '12'
    }

    _, day, month, year = date.split()
    formatted_date = f"{year}-{mk_months[month]}-{day.zfill(2)}"
    parsed_date = datetime.strptime(formatted_date, "%Y-%m-%d").date()
    return parsed_date

def sync_process_news(db_params, link, link_mk):
    db = Database(**db_params)

    async def add_missing_news_wrapper():
        await db.connect()

        news = await fetch_news(link)  # Filter 2
        news_mk = await fetch_news(link_mk)  # Filter 2

        await add_missing_news(db, news, news_mk)

        await db.close()

    asyncio.run(add_missing_news_wrapper())


@timer
async def main():
    db_params = {"user": "postgres", "password": "postgres", "database": "DB"}
    db = Database(**db_params)
    await db.connect()
    await db.create_tables()
    await db.close()

    links = await fetch_links()  # Filter 1

    with Pool(processes=12) as pool:
        pool.starmap(sync_process_news, [(db_params, link, link_mk) for link, link_mk in links])


if __name__ == "__main__":
    asyncio.run(main())
