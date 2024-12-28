from datetime import datetime, timedelta
from multiprocessing import Pool
import aiohttp
import asyncio
import time
from bs4 import BeautifulSoup, SoupStrainer
from db import Database
from io import BytesIO
from PyPDF2 import PdfReader
import requests

# Timer decorator to measure execution time
def timer(func):
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        result = await func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} completed in {end_time - start_time:.2f} seconds.")
        return result

    return wrapper


@timer
async def fetch_issuers(db):
    issuers = await db.get_issuers()

    issuers_map = {}

    for issuer_code, db_id in issuers:
        url = f"https://www.mse.mk/en/symbol/{issuer_code}"

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                response_text = await response.text()
                soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("div"))

                link = soup.select_one("a[href^='https://seinet.com.mk/search/']")

                if link is None:
                    continue
                
                issuer_id = int(link.get("href").split("/")[-1])

                issuers_map[issuer_code] = [issuer_id, db_id]

    return issuers_map


@timer
async def get_last_available_news_date(db, issuer_id):
    return await db.get_last_available_news_date(issuer_id)


@timer
async def fill_in_missing_data(db, issuer_id, db_id, last_date):
    news_ids = await fetch_news(issuer_id, last_date)

    for news_id in news_ids:
        if await db.get_news_id(int(news_id)):
            continue

        if result := await fetch_article(news_id):
            seinet_id, content, date, attachments = result
            await db.add_issuer_news(db_id, seinet_id, content, date, attachments)


@timer
async def fetch_news(issuer_id, last_date):
    if last_date is None:
        last_date = datetime.now() - timedelta(days=365)

    url = f"https://api.seinet.com.mk/public/documents"

    params = {
        "channelId": 1,
        "dateFrom": last_date.strftime("%Y-%m-%dT%H:%M:%S"),
        "dateTo": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "isPushRequest": "false",
        "issuerId": issuer_id,
        "languageId": 2,
        "page": 1
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=params) as response:
            json_data = (await response.json())["data"]
            
            if not json_data:
                return []
            
            return [item["documentId"] for item in json_data]


async def fetch_article(news_id):
    url = f"https://api.seinet.com.mk/public/documents/single/{news_id}"

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            json_data = await response.json()

            if not json_data.get("data"):
                return None

            article = json_data["data"]
            seinet_id = article.get("documentId")
            content = article.get("content", "")
            date = datetime.strptime(article.get("publishedDate").split(".")[0], "%Y-%m-%dT%H:%M:%S").date()
            
            attachment_content = []
            attachments = article.get("attachments", [])
            
            if attachments:
                for attachment in attachments:
                    if "application/pdf" in attachment["attachmentType"]["mimeType"]:
                        pdf_text = fetch_attachment(attachment["attachmentId"])
                        attachment_content.extend(pdf_text)

            return seinet_id, content, date, attachment_content


def fetch_attachment(attachment_id):
    url = f"https://api.seinet.com.mk/public/documents/attachment/{attachment_id}"

    with requests.get(url) as response:
        pdf = PdfReader(BytesIO(response.content))
        contents = []
        
        for page in pdf.pages:
            text = page.extract_text()
            contents.extend(line.strip() for line in text.split("\n") if line.strip())
 
        return contents


def sync_process_news(db_params, issuer_id, db_id):
    db = Database(**db_params)

    async def process_news():
        await db.connect()  
        
        last_date = await get_last_available_news_date(db, issuer_id)
        await fill_in_missing_data(db, issuer_id, db_id, last_date)

        await db.close()

    asyncio.run(process_news())


@timer
async def main():
    db_params = {"user": "postgres", "password": "postgres", "database": "DB"}
    db = Database(**db_params)

    await db.connect()
    await db.create_tables()

    issuers_map = await fetch_issuers(db)

    await db.close()

    with Pool(processes=12) as pool:
        pool.starmap(sync_process_news, [(db_params, issuer_id, db_id) for issuer_id, db_id in issuers_map.values()])


if __name__ == "__main__":
    asyncio.run(main())