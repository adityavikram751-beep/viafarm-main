import React from "react";
import Topbar from "../buyers/Topbar";
import BuyersPanel from "../buyers/BuyerPannel";



function Page() {
  return (
    <div className="p-6 space-y-1 ">
      
      
      <Topbar /> 
      <div className="mt-4">
        <BuyersPanel/>
      
           
      </div>
    </div>
  );
}

export default Page;
