import React from 'react';
import Header from "./header";
const AdminMasterLayout = ({ children }) => {
  return (

    <div className='home' style={{}}>
      <Header />
      {children}
    </div>
  )
}

export default AdminMasterLayout;
