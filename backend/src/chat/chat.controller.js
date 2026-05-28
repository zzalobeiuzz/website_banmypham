const {
	getSupportRoomForUser,
	getRoomDetail,
	listRoomsForAdmin: listRoomsForAdminService,
	markSeen,
} = require("./chat.service");
const { getLinkPreview } = require("./linkPreview.service");

// Controller của chat: nhận các request HTTP liên quan đến chat (lấy phòng, tin nhắn, đánh dấu đã xem, preview link)

async function getMySupportRoom(req, res) {
	try {
		const data = await getSupportRoomForUser({ user: req.user });
		return res.json({ success: true, ...data });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message || "Không thể tải phòng chat." });
	}
}

async function getRoomMessages(req, res) {
	try {
		const roomId = Number(req.params.roomId || 0);
		const data = await getRoomDetail({ roomId, user: req.user });
		return res.json({ success: true, ...data });
	} catch (error) {
		const status = /quyền|không tồn tại/i.test(String(error.message || "")) ? 403 : 500;
		return res.status(status).json({ success: false, message: error.message || "Không thể tải tin nhắn." });
	}
}

async function listRoomsForAdmin(req, res) {
	try {
		const rooms = await listRoomsForAdminService();
		return res.json({ success: true, data: rooms });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message || "Không thể tải danh sách phòng chat." });
	}
}

async function markRoomSeen(req, res) {
	try {
		const roomId = Number(req.params.roomId || 0);
		await markSeen({ roomId, user: req.user });
		return res.json({ success: true });
	} catch (error) {
		const status = /quyền|không tồn tại/i.test(String(error.message || "")) ? 403 : 500;
		return res.status(status).json({ success: false, message: error.message || "Không thể cập nhật trạng thái đã xem." });
	}
}

async function getLinkPreviewHandler(req, res) {
	try {
		const preview = await getLinkPreview({ url: req.body?.url || req.query?.url });
		return res.json({ success: true, data: preview });
	} catch (error) {
		return res.status(400).json({ success: false, message: error.message || "Không thể tạo xem trước liên kết." });
	}
}

module.exports = {
	getMySupportRoom,
	getRoomMessages,
	listRoomsForAdmin,
	markRoomSeen,
	getLinkPreview: getLinkPreviewHandler,
};