.input_search {
  width: 100%;
  flex: 1;
  border: none;
  outline: none;
  padding-left: 10px;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  transform: translateX(100%);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0);
  }

  &.hidden {
    display: none;
  }
}
