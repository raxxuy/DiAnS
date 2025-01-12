from aiohttp import ClientSession
from datetime import datetime
from bs4 import BeautifulSoup, SoupStrainer


async def fetch_news(link):
    url = f"https://www.mse.mk{link}"

    async with ClientSession() as session:
        async with session.get(url) as response:
            response_text = await response.text()
            soup = BeautifulSoup(response_text, "lxml", parse_only=SoupStrainer("main"))
            title = soup.select_one(".col-md-9").text.strip() if soup.select_one(".col-md-9") else None
            date = soup.select_one(".news-date").text.strip() if soup.select_one(".news-date") else None
            content = [p.text.strip() for p in soup.select("#content > p")]

            if content == ["/"] or title is None or date is None:
                return None

            return title, date, content
        
        
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