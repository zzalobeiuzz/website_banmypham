import React from 'react';
import Header from "./header";
const AdminMasterLayout = ({ children }) => {
  return (

    <div >
      <Header />
      {children}
    </div>
  )
}

export default AdminMasterLayout;
