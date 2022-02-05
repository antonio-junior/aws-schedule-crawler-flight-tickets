"use strict";

const chromium = require("chrome-aws-lambda");
const cheerio = require("cheerio");
const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const util = require("util");

const extractHtml = async page => {
  const mainHtml = await page.evaluate(
    el => el.innerHTML,
    await page.$(".FlightsHotelsSwitchWrapper")
  );

  const $ = cheerio.load(mainHtml);

  let price = 0;

  $(".FlightsHotelsSwitchTabPrice > span > div").each((i, element) => {
    price = $(element).text();
  });

  return price;
};

module.exports.scheduler = async event => {
  console.log(
    "Reading options from event:\n",
    util.inspect(event, { depth: 5 })
  );
  const siteUrl = "https://www.skyscanner.com.br/transport/flights/REC/POA?oym=2103&iym=2103&selectedoday=01&selectediday=01"
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
