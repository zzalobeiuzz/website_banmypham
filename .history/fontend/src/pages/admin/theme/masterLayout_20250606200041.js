import React from 'react';
import Header from "./header";
const AdminMasterLayout = ({ children }) => {
  return (
      <Header/>
      <div>{children}</div>
  )
}

export default AdminMasterLayout;
