.product-detail {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .btn {
      padding: 8px 14px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 600;

      &.back {
        background-color: #eee;
      }

      &.edit {
        background-color: #4caf50;
        color: white;
        margin-right: 10px;
      }

      &.delete {
        background-color: #f44336;
        color: white;
      }
    }

    .btn-group {
      display: flex;
    }
  }
}
