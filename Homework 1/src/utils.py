import asyncio
from aiohttp import ClientSession
from datetime import datetime, timedelta
from bs4 import BeautifulSoup, SoupStrainer


async def fetch_company(code):
    url = f"https://www.mse.mk/en/symbol/{code}"

    company_data = {
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
                return code

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
    semaphore = asyncio.Semaphore(10)

    async def fetch_data(url_):
        async with semaphore:
            async with ClientSession() as session:
                async with session.get(url_) as response:

                    response_text = await response.text()
                    strainer = SoupStrainer('tbody')
                    soup = BeautifulSoup(response_text, 'lxml', parse_only=strainer)

                    rows = soup.select("tbody tr")
                    fetched_data = []

                    for row in rows:
                        cols = [col.text.strip() for col in row.select("td")]
                        if any(col == "" for col in cols):
                            continue
                        fetched_data.append(cols)

                    return fetched_data

    while to_time > from_time:
        to_date = to_time.strftime("%m,%d,%Y")
        from_date = from_time.strftime("%m,%d,%Y")
        url = f"https://www.mse.mk/en/stats/symbolhistory/{code}?FromDate={from_date}&ToDate={to_date}"

        tasks.append(fetch_data(url))
        to_time -= timedelta(days=365)

    results = await asyncio.gather(*tasks)

    for result in results:
        for cols in result:
            if cols not in data:
                data.append(cols)

    return data
