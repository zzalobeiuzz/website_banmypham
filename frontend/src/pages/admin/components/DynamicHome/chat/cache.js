// Bộ nhớ tạm (RAM) cho admin chat: lưu messages theo RoomID
// Mục tiêu là quay lại room cũ thì hiện dữ liệu ngay, không phải tải lại từ đầu.
const cache = new Map();

export const getRoomCache = (roomId) => {
  return cache.get(String(roomId)) || null;
};

export const setRoomCache = (roomId, data) => {
  cache.set(String(roomId), data);
};

export const clearRoomCache = (roomId) => {
  cache.delete(String(roomId));
};

export const clearAllRoomCache = () => {
  cache.clear();
};

const ChatCache = {
  getRoomCache,
  setRoomCache,
  clearRoomCache,
  clearAllRoomCache,
};

export default ChatCache;
