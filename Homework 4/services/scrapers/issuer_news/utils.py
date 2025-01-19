import requests
from io import BytesIO
from PyPDF2 import PdfReader
from typing import List, Tuple, Optional
from aiohttp import ClientSession
from datetime import datetime, timedelta, date

# Type aliases
NewsID = int
NewsContent = Tuple[int, str, date, List[str]]  # (seinet_id, content, date, attachments)


async def fetch_news(issuer_id: int, last_date: Optional[date]) -> List[NewsID]:
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
    
    async with ClientSession() as session:
        async with session.post(url, json=params) as response:
            json_data = (await response.json())["data"]
            
            if not json_data:
                return []
            
            return [item["documentId"] for item in json_data]


async def fetch_article(news_id: int) -> Optional[NewsContent]:
    url = f"https://api.seinet.com.mk/public/documents/single/{news_id}"

    async with ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                return None
            
            json_data = await response.json()

            if not json_data["data"]:
                return None

            article = json_data["data"]
            seinet_id = article["documentId"]
            content = article.get("content", "")
            date = datetime.strptime(article["publishedDate"].split(".")[0], "%Y-%m-%dT%H:%M:%S").date()
            
            attachment_content: List[str] = []
            attachments = article["attachments"]
            
            if attachments:
                for attachment in attachments:
                    if "application/pdf" in attachment["attachmentType"]["mimeType"]:
                        pdf_text = fetch_attachment(attachment["attachmentId"])
                        attachment_content.extend(pdf_text)

            return seinet_id, content, date, attachment_content


def fetch_attachment(attachment_id: int) -> List[str]:
    url = f"https://api.seinet.com.mk/public/documents/attachment/{attachment_id}"

    with requests.get(url) as response:
        pdf = PdfReader(BytesIO(response.content))
        contents: List[str] = []
        
        for page in pdf.pages:
            text = page.extract_text()
            contents.extend(line.strip() for line in text.split("\n") if line.strip())
 
        return contents