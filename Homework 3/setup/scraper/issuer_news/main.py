from datetime import datetime
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
async def fetch_news(issuer):
    url = f"https://www.mse.mk/en/symbol/{issuer}"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            response_text = await response.text()
            soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("main", {"id": "main"}))
            
            news_section = soup.select_one("#seiNetIssuerLatestNews")

            if not news_section:
                return []
            
            return [a.get("href").split("/")[-1] for a in news_section.select("a")]


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


def sync_process_news(db_params, issuer):
    db = Database(**db_params)

    async def process_news():
        await db.connect()
        
        latest_news = await fetch_news(issuer)
        issuer_id = await db.get_issuer_id(issuer)

        for news_id in latest_news:
            if await db.get_news_id(int(news_id)):
                continue

            if result := await fetch_article(news_id):
                seinet_id, content, date, attachments = result
                await db.add_issuer_news(issuer_id, seinet_id, content, date, attachments)

        await db.close()

    asyncio.run(process_news())


@timer
async def main():
    db_params = {"user": "postgres", "password": "postgres", "database": "DB"}
    db = Database(**db_params)

    await db.connect()
    await db.create_tables()

    issuers = [issuer[0] for issuer in await db.get_issuers()]

    await db.close()

    with Pool(processes=12) as pool:
        pool.starmap(sync_process_news, [(db_params, issuer) for issuer in issuers])


if __name__ == "__main__":
    asyncio.run(main())
