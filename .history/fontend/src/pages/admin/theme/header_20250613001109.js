const toggleSearch = () => {
  if (isActive) {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsActive(false);
    }, 1000); // Thời gian khớp animation CSS
  } else {
    setIsActive(true);
  }
};
