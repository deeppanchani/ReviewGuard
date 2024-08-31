import * as cheerio from "cheerio"
import _ from "lodash"

import { ACTIONS } from "~utils/constants"

interface Review {
  userName: string;
  starRating: number;
  reviewTitle: string;
  reviewContent: string;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const broadcastToContentScript = (payload) => {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, payload)
    })
  } catch (error) {
    console.error("ERROR ~ unable to broadcast to content script", error)
  }
}

const parseReviews = (html) => {
  const $ = cheerio.load(html);

  // Array to store extracted review data
  const reviews = [];

  // Iterate over each review element
  $('div[data-hook="review"]').each((index, element) => {
    const review: Review = {
      userName: $(element).find('span.a-profile-name').text().trim(),
      starRating: parseFloat($(element).find('i[data-hook="review-star-rating"] > span.a-icon-alt').text().trim().split(' ')[0]),
      reviewTitle: $(element).find('a[data-hook="review-title"] > span').last().text().trim(),
      reviewContent: $(element).find('span[data-hook="review-body"]').text().trim(),
    };

    reviews.push(review);
  });

  return reviews;
};

const getActiveTabUrl = async () => {
  try {
    const [activeTab] = await new Promise<chrome.tabs.Tab[]>((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, resolve)
    })
    return activeTab.url
  } catch (error) {
    console.error("ERROR ~ unable to fetch current url", error)
    return null
  }
}

const messageInterceptor = async (
  message: { action: string; data?: Record<string, unknown> },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
) => {
  console.log("message received", message)
  switch (message.action) {
    case ACTIONS.OPEN_DASHBOARD:
      try {

        const url = message.data?.url as string;
        // console.log("~ url:", url);
        let pageNumber = 1;
        let allReviews = [];

        let limit = 50;
        while (limit --) {
          const currentPageUrl = `${url}&reviewerType=all_reviews#reviews-filter-bar&pageNumber=${pageNumber}`;
          console.log("~ url:", currentPageUrl)
          const webpageResponse = await fetch(currentPageUrl);
          const html = await webpageResponse.text();
          const reviews = parseReviews(html);
          
          if (reviews.length === 0) {
            break;
          }
          // console.log(reviews.length)
          allReviews = allReviews.concat(reviews);
          pageNumber++;
        }

        console.log("All reviews:", allReviews);
                
        const modelResponse = await fetch("http://127.0.0.1:5000/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reviewsData: allReviews
        })
        })

        // Parse response body as JSON
        const responseBody = await modelResponse.json();

        // Log the response body
        console.log(responseBody.prediction);

        let real = [];
        let fake = [];

        for (let i = 0; i < responseBody.prediction.length; i++) {
            if (responseBody.prediction[i] === 0) {
                real.push(allReviews[i]);
            } else {
                fake.push(allReviews[i]);
            }
        }
        
        let totalRating = 0;
        let realCount = 0;
        let fakeCount = 0;


        real.forEach(review => {
          // Add the starRating of each review to the totalRating
          totalRating += review.starRating;
        });        

        // Calculate average rating
        const averageRating = totalRating / real.length;

        // Calculate ratio of real to fake reviews
        const ratioRealToFake = realCount / fakeCount;

        const data = {
          averageRating,
          ratioRealToFake,
          real,
          fake
        }



        console.log(data)
        sendResponse({ status: true, data });

        break
      } catch (err) {
        console.log(`ERROR/EXTRACTING_REVIEWS:${err}`)
        // send error message to content script, aka the popup
        await chrome.runtime.sendMessage({
          status: false,
          message: err.message
        })
      }

    default:
      console.warn("unknown message received ", message.action)
  }
}

chrome.runtime.onMessage.addListener(messageInterceptor)

// const response = await chrome.runtime.sendMessage({ greeting: "hello" })
// console.log(response)