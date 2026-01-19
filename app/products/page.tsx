import React from "react";
import Topbar from "../products/Topbar";
import ProductTable from "../products/ProductTable";


function Page() {
  return (
    <div className="p-6 space-y-1 ">
      
      
      <Topbar /> 
      <div className="mt-4">
        <ProductTable/>
      
           
      </div>
    </div>
  );
}

export default Page;
