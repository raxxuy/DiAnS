from datetime import datetime
from multiprocessing import Pool
import aiohttp
import asyncio
import time
from bs4 import BeautifulSoup, SoupStrainer
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
                links.extend([a.get("href") for a in soup.select("a")])

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
async def add_missing_news(db, news):
    if news is None:
        return

    title, date, content = news
    parsed_date = datetime.strptime(date, "%A, %B %d, %Y").date()

    await db.add_news(title, parsed_date, content)


def sync_process_news(db_params, link):
    db = Database(**db_params)

    async def add_missing_news_wrapper():
        await db.connect()

        news = await fetch_news(link)  # Filter 2
        await add_missing_news(db, news)  # Filter 3

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
        pool.starmap(sync_process_news, [(db_params, link) for link in links])


if __name__ == "__main__":
    asyncio.run(main())
