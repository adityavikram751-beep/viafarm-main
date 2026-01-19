import React from "react";
import Topbar from "../vendors/Topbar";
import Vendors from "./VendorsTable";


function Page() {
  return (
    <div className="p-6 space-y-1 ">
      
      
      <Topbar /> 
      <div className="mt-4">
        <Vendors/>
      
           
      </div>
    </div>
  );
}

export default Page;
