import asyncio
import time

from aiohttp import ClientSession
from aiolimiter import AsyncLimiter
from datetime import datetime, timedelta
from bs4 import BeautifulSoup, SoupStrainer

limiter = AsyncLimiter(max_rate=10, time_period=1)

async def fetch_company(code):
    url = f"https://www.mse.mk/en/symbol/{code}"

    company_data = {
        "Code": code,
        "Name": "",
        "Address": "",
        "City": "",
        "State": "",
        "Mail": "",
        "Site": "",
        "Contact person": "",
        "Phone": [],
        "Fax": []
    }

    async with ClientSession() as session:
        async with session.get(url) as response:

            response_text = await response.text()
            strainer = SoupStrainer('div', {'class': 'tab-content panel-body', 'id': "izdavach"})
            soup = BeautifulSoup(response_text, 'lxml', parse_only=strainer)

            title = soup.select_one("div.title")

            if title is None:
                return [code, code]

            company_data["Name"] = title.text
            details = soup.select("div#izdavach .row")[2:13]

            for row in details:
                cols = row.select("div")

                if cols:
                    key_text = cols[0].text

                    if key_text in company_data:
                        if key_text in ("Phone", "Fax"):
                            company_data[key_text].extend(cols[1].text.split("; "))
                        else:
                            company_data[key_text] = cols[1].text
                    else:
                        company_data["Contact person"] = cols[1].text.split("\n")[1]

    return list(company_data.values())


async def fetch_stock_history(code):
    to_time = datetime.now()
    from_time = to_time - timedelta(days=3650)

    data = []
    tasks = []

    async def fetch_data(url_):
        async with limiter:  # Apply rate limiting
            async with ClientSession() as session:
                async with session.get(url_) as response:
                    if response.status != 200:
                        time.sleep(1)
                        return await fetch_data(url_)

                    response_text = await response.text()
                    soup = BeautifulSoup(response_text, 'lxml', parse_only=SoupStrainer('tbody'))

                    rows = soup.select("tbody tr")
                    fetched_data = []
                    for row in rows:
                        cols = [col.text.strip() for col in row.select("td")]
                        if any(col == "" for col in cols):
                            continue
                        fetched_data.append(cols)
                    return fetched_data

    while to_time > from_time:
        to_date = to_time.strftime("%d,%m,%Y")
        from_date = from_time.strftime("%d,%m,%Y")
        url = f"https://www.mse.mk/mk/stats/symbolhistory/{code}?FromDate={from_date}&ToDate={to_date}"
        tasks.append(fetch_data(url))
        to_time -= timedelta(days=365)

    results = await asyncio.gather(*tasks)

    for result in results:
        for cols in result:
            if cols not in data:
                data.append(cols)

    return data
