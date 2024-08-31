import {
  IconSearch,
  IconStar,
  IconStarFilled,
  IconX
} from "@tabler/icons-react"
import cssText from "data-text:~style.css"
import { motion } from "framer-motion"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useRef, useState } from "react"

import { ACTIONS } from "~utils/constants"

export const config: PlasmoCSConfig = {
  matches: ["https://www.amazon.in/*"],
  all_frames: true
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}



const StarRatings = ({ rating }) => {
  const filledCount = Math.min(Math.floor(rating), 5)
  const hollowCount = Math.max(0, 5 - filledCount)
  return (
    <div className="flex items-center mb-1">
      {[...Array(filledCount)].map((_, index) => (
        <IconStarFilled key={index} size={24} className="text-yellow-500" />
      ))}
      {[...Array(hollowCount)].map((_, index) => (
        <IconStar key={index} size={24} className="text-slate-300" />
      ))}
    </div>
  )
}

const PopupTrigger = ({ setUiState, initiateExtraction }) => {
  return (
    <div
      onClick={() => {
        initiateExtraction()
        setUiState()
      }}>
      <div className="invisible group-hover:visible">
        {/* tooltip */}
        <motion.div
          className="absolute right-12 text-xs font-medium z-[999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}>
          <div className="font-bold relative bg-gray-800/60 text-slate-700 rounded-lg py-[10px] px-3 whitespace-nowrap">
            👀
          </div>
        </motion.div>
      </div>
      <div className="group-hover:pr-4 p-3 rounded-l-md pr-3 bg-slate-800/80">
        <div className="h-3 rounded-full w-3 bg-rose-500/60 animate-pulse"></div>
      </div>
    </div>
  )
}

const AwaitingState = ({ setUiState, productTitle}) => {
  return (
    <div
      className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-slate-900 font-inter">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          <span className="text-blue-400">Review</span>Guard
        </h2>
        <div className="flex">
          <IconX onClick={()=>setUiState("IDLE")} size={24} />
        </div>
      </div>
      <div className="flex-row gap-4 mb-4">
        <div className="flex items-start gap-4">
          <span className="mr-2">Product:</span>
          <span className="font-semibold " style={{ textAlign: "left" }}>
            {productTitle}
          </span>
        </div>
        <div className="flex items-start gap-4">
          <span className="mr-2">Amazon Rating:</span>
          <span className="font-semibold " style={{ textAlign: "left" }}>3.2</span>
          <IconStarFilled size={16} className="text-yellow-500" />
        </div>
        <div className="flex justify-center mt-8"> {/* Adjust margin-top (mt-8) as needed */}
          <button
            // onClick={() => setUiState("FINAL")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Analysing Reviews
          </button>
        </div>
      </div>
    </div>
  )
}

const ResponseState = ({ setUiState, productTitle, reviewsData }) => {
  const [tabID, setTabID] = React.useState("all");
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [tabID]);

  const renderReviews = (reviews) => {
    return reviews.map((review, index) => (
      <div key={index} className="bg-slate-100 p-4 rounded-lg border-4 border-solid border-white">
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-bold">{review.userName}</h4>
          <div className={`bg-${review.type === "real" ? "green" : "rose"}-500 text-white inline-flex w-fit items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent`}>
            {review.type === "real" ? "Real" : "Fake"}
          </div>
        </div>
        <StarRatings rating={review.starRating} />
        <h5 className="font-semibold mt-4 mb-1" style={{ textAlign: 'left' }}>
          {review.reviewTitle}
        </h5>
        <p className="text-sm" style={{ textAlign: 'left' }}>
          {review.reviewContent}
        </p>
      </div>
    ));
  };

  const getTabContent = () => {
    if (tabID === "real") {
      return renderReviews(reviewsData.real.map(review => ({ ...review, type: "real" })));
    }
    if (tabID === "fake") {
      return renderReviews(reviewsData.fake.map(review => ({ ...review, type: "fake" })));
    }
    return renderReviews([
      ...reviewsData.real.map(review => ({ ...review, type: "real" })),
      ...reviewsData.fake.map(review => ({ ...review, type: "fake" })),
    ]);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-slate-900 font-inter">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          <span className="text-blue-400">Review</span>Guard
        </h2>
        <div className="flex">
          <IconX onClick={() => setUiState("IDLE")} size={24} />
        </div>
      </div>
      <div className="flex-row gap-x-10 mb-4">
        <div className="flex items-start gap-2">
          <span className="mr-2">Product:</span>
          <span className="font-semibold " style={{ textAlign: "left" }}>
            {productTitle}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mr-2">Amazon Rating:</span>
          <span className="font-semibold" style={{ textAlign: "left" }}>{reviewsData.averageRating.toFixed(1)}</span>
          <IconStarFilled size={16} className="text-yellow-500" />
        </div>
        <div className="flex items-start gap-2">
          <span className="mr-2">ReviewGuard Rating</span>
          <span className="font-semibold" style={{ textAlign: "left" }}>{reviewsData.averageRating.toFixed(1)}</span>
          <IconStarFilled size={16} className="text-yellow-500" />
        </div>{" "}
        <div className="flex items-start gap-2">
          <span className="mr-2">Authenticity Ratio</span>
          <span className="font-semibold " style={{ textAlign: "left" }}>{reviewsData.real.length/reviewsData.fake.length}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setTabID("all")}
          className={`py-2 px-4 rounded font-bold ${tabID === "all" ? "bg-blue-500 text-white" : "bg-white hover:bg-slate-200 text-blue-500 border-solid border"}`}
        >
          All ({reviewsData.real.length + reviewsData.fake.length})
        </button>
        <button
          onClick={() => setTabID("real")}
          className={`py-2 px-4 rounded font-bold ${tabID === "real" ? "bg-green-500 text-white" : "bg-white hover:bg-slate-200 text-green-500 border-solid border"}`}
        >
          Real ({reviewsData.real.length})
        </button>
        <button
          onClick={() => setTabID("fake")}
          className={`py-2 px-4 rounded font-bold ${tabID === "fake" ? "bg-rose-500 text-white" : "bg-white hover:bg-slate-200 text-rose-500 border-solid border"}`}
        >
          Fake ({reviewsData.fake.length})
        </button>
      </div>
      <div ref={scrollContainerRef} className="space-y-4 max-h-56 custom-scrollbar scrollbar-hide overflow-y-scroll">
        {getTabContent()}
      </div>
    </div>
  );
}


// https://www.tremor.so/docs/visualizations/donut-chart
// https://www.amazon.in/Sony-PS5-PlayStation-Console/dp/B0BRCP72X8/?_encoding=UTF8&pd_rd_w=KdT1E&content-id=amzn1.sym.4c78ee3f-a963-49e9-99df-1a54e5be0e41&pf_rd_p=4c78ee3f-a963-49e9-99df-1a54e5be0e41&pf_rd_r=4F2GT7SDTP5DSN6B081S&pd_rd_wg=ss03W&pd_rd_r=61df48b3-6f7b-4540-92d5-5e07e12d2ed2
const PlasmoOverlay = () => {

  const [interactive, setInteractive] = React.useState(true)
  const [uiState, setUiState] = useState("IDLE")
  const uiStateRef = useRef("IDLE")
  const [counter, setCounter] = useState(0)
  console.log("::: PlasmoOverlay ~ uiState:", uiState)

  const setStateToInitail = () => {
    console.log("xyz INITIAL")
    setUiState("INITIAL")
    // uiStateRef.current = "INITIAL"
  }

  const initiateExtraction = async () => {
    const seeAllReviewsLink = document.querySelector(
      "a[data-hook='see-all-reviews-link-foot']"
    )
    const reviewsHref = `https://www.amazon.in${seeAllReviewsLink?.getAttribute(
      "href"
    )}` // https://www.amazon.in/Sony-PS5-PlayStation-Console/product-reviews/B0BRCP72X8/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews
    console.log(reviewsHref)
    const response = await chrome.runtime.sendMessage({
      action: ACTIONS.OPEN_DASHBOARD,
      data: {
        url: reviewsHref
      }
    })
    console.log(response.data)
    return response
  }

  const [reviewsData, setReviewsData] = useState(null);

  useEffect(()=>{
    uiStateRef.current = uiState
    setCounter(prev=>prev+1)
  }, [uiState])

  console.log("this is uiState value", uiStateRef.current)

  const productName = document.getElementById('productTitle').textContent;
  const amazonRatting = document.getElementById('productTitle').textContent;

  return (
    <button
      onClick={ async () => {
        setInteractive(true)
        const response = await initiateExtraction()
        if (response) {
          setReviewsData(response.data);
          setUiState("FINAL");
          uiStateRef.current = "FINAL";
        }
      }}

      className="z-50 group flex fixed right-0 top-16">
      {uiStateRef.current == "IDLE" ? (
        <PopupTrigger setUiState={setStateToInitail} initiateExtraction={() => {}} />
      ) : uiStateRef.current == "INITIAL" ? (
        <AwaitingState setUiState={setUiState} productTitle={productName} />
      ) : (
        <ResponseState setUiState={setUiState} productTitle={productName} reviewsData={reviewsData}/>
      )}
    </button>
  )
}

export default PlasmoOverlay
