import React from "react";
import Topbar from "../orders/Topbar";
import OrderTable from "../orders/OrderTable";


function Page() {
  return (
    <div className="p-6 space-y-1 ">
      
      
      <Topbar /> 
      <div className="mt-4">
        <OrderTable/>
      
           
      </div>
    </div>
  );
}

export default Page;
