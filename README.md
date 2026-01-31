# Cyprus Price Watchdog

Since Cyprus government [eKalathi](https://www.e-kalathi.gov.cy/) release, consumers are able to compare prices. But the consumers are unable to monitor the increase of the prices relative to other prices or the inflation.

This tool comes to serve this exact purpose, to monitor the price fluctuation over time and compare with the inflation and commodities that affect inflation.

## How it works

The tool has 3 components. The scraper, the database and the web application.
The scraper is responsible to scrape the prices from the government's API every 6 hours. The data it collects are then stored in a database (timestamp, price, product etc). The web application consists of a web server serving the application and an API server to serve the data from the database. The web application is the user interface, designed to make it simple for everyday and non technical users.

## Where is it hosted

The tool is hosted in Google cloud, the IaC that helps provisioning the code is also part of this repository.

