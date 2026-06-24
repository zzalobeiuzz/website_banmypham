const express = require("express");
const router = express.Router();

const authMiddleware = require("../user/middlewares/auth.middleware");
const chatController = require("./chat.controller");


// lây thông tin phòng chat hỗ trợ của người dùng hiện tại (dành cho người dùng)
router.get("/me/room", authMiddleware.verifyToken, chatController.getMySupportRoom);
// Lấy tin nhắn của một phòng chat cụ thể (dành cho người dùng và admin đã có quyền truy cập)
router.get("/rooms/:roomId/messages", authMiddleware.verifyToken, chatController.getRoomMessages);
// Gửi tin nhắn vào một phòng chat (dành cho người dùng và admin đã có quyền truy cập)
router.post("/rooms/:roomId/seen", authMiddleware.verifyToken, chatController.markRoomSeen);
// Lấy dữ liệu preview của một URL để hiển thị trong chat
router.post("/preview", authMiddleware.verifyToken, chatController.getLinkPreview);
// Lấy danh sách phòng chat (dành riêng cho admin)
router.get("/admin/rooms", authMiddleware.verifyAdmin, chatController.listRoomsForAdmin);

module.exports = router;
