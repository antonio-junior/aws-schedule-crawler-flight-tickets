"use strict";

const chromium = require("chrome-aws-lambda");
const cheerio = require("cheerio");
const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const util = require("util");

const extractHtml = async page => {
  const mainHtml = await page.evaluate(
    el => el.innerHTML,
    await page.$(".cards-price-cia")
  );

  const $ = cheerio.load(mainHtml);

  const names = [];
  const dates = [];
  const prices = [];

  $(".cards-price-cia__card-cia__name").each((i, element) =>
    names.push($(element).text())
  );
  $(".cards-price-cia__card-cia__flight-date").each((i, element) =>
    dates.push($(element).text())
  );
  $(".cards-price-cia__card-cia__price").each((i, element) =>
    prices.push($(element).text())
  );

  const cardsInfo = names.map((name, index) => ({
    name,
    date: dates[index].replace(/\n\n\n\n/g, ' - ').replace(/[\n]/g, ''),
    price: prices[index]
  }));

  return cardsInfo;
};

module.exports.scheduler = async event => {
  console.log(
    "Reading options from event:\n",
    util.inspect(event, { depth: 5 })
  );
  //const siteUrl = "https://www.skyscanner.com.br/transport/flights/REC/POA?oym=2103&iym=2103&selectedoday=01&selectediday=01"
  const siteUrl =
  "https://www.viajanet.com.br/passagens-aereas/quandoviajar/REC/POA";
  let browser = null;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
      devtools: false
    });

    const page = await browser.newPage();

    await page.goto(siteUrl, ["load", "domcontentloaded", "networkidle0"]);
console.log(await page.title())
    const featuresList = await extractHtml(page);

    console.log(featuresList);
  } catch (error) {
    console.log(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: event
      },
      null,
      2
    )
  };
};
