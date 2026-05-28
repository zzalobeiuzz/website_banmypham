// Bộ nhớ tạm trong RAM cho admin chat: lưu message theo RoomID để mở lại là có dữ liệu ngay.
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
