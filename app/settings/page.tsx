'use client';

import React from 'react';
import Topbar from './Topbar';
import Settingspanel from './Settingspanel';

function Page() {
  return (
    <div className="p-6 space-y-1 ">
      <Topbar />
      <div className="mt-4">
        <Settingspanel />
      </div>
    </div>
  );
}

export default Page;
