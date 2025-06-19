import React from 'react';
import Header from "./header";
const AdminMasterLayout = ({ children }) => {
  return (

    <div className='home'>
      <Header />
      {children}
    </div>
  )
}

export default AdminMasterLayout;
