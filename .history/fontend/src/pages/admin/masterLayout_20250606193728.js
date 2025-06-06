import React from 'react';

const AdminMasterLayout = ({ children }) => {
  return (
    <div>
      <h1>Admin Header</h1>
      <div>{children}</div>
      <footer>Admin Footer</footer>
    </div>
  )
}

export default AdminMasterLayout;
