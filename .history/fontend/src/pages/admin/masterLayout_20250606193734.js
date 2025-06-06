import React from 'react';

const AdminMasterLayout = ({ children }) => {
  return (
    <div>

      <div>{children}</div>
      <footer>Admin Footer</footer>
    </div>
  )
}

export default AdminMasterLayout;
