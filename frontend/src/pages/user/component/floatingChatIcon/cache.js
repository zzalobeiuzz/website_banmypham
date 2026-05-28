// Bộ nhớ tạm trong RAM cho chat nổi của người dùng: lưu message theo roomId.
const cache = new Map();

exports.getRoomCache = (roomId) => {
  return cache.get(String(roomId)) || null;
};

exports.setRoomCache = (roomId, data) => {
  cache.set(String(roomId), data);
};

exports.clearRoomCache = (roomId) => {
  cache.delete(String(roomId));
};

exports.clearAll = () => cache.clear();

// Để import theo kiểu ESModule vẫn dùng được trong CRA/Babel
exports.default = {
  getRoomCache: exports.getRoomCache,
  setRoomCache: exports.setRoomCache,
  clearRoomCache: exports.clearRoomCache,
  clearAll: exports.clearAll,
};
