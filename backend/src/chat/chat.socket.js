const jwt = require("jsonwebtoken"); // Thư viện dùng để verify JWT token
const chatService = require("./chat.service"); // Service xử lý logic chat/database

const {
  getSupportRoomForUser,
  markSeen,
  getRoomDetail,
  sendMessage,
  getRoomById,
} = chatService;

// Lấy secret key từ biến môi trường
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Hàm lấy token từ socket handshake
 * Có hỗ trợ:
 * 1. socket.handshake.auth.token
 * 2. Authorization: Bearer xxx
 */
const getSocketToken = (socket) => {
  // Token gửi qua auth khi connect socket
  const authToken = socket.handshake?.auth?.token;
  if (authToken) return authToken;

  // Token gửi qua header Authorization
  const authHeader = socket.handshake?.headers?.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // Không có token
  return null;
};


//  Chuẩn hóa roomId từ props
const getRoomIdFromPayload = (payload) =>
  Number(payload?.roomId || payload?.RoomID || 0);

/**
 * Hàm attach websocket chat vào io
 */
exports.attachChatSocket = (io) => {

  /**
   * Middleware xác thực socket trước khi connect
   */
  io.use((socket, next) => {
    try {
      // Lấy token
      const token = getSocketToken(socket);

      // Không có token
      if (!token) {
        return next(new Error("Thiếu token xác thực."));
      }

      // Verify JWT
      const decoded = jwt.verify(token, JWT_SECRET);

      // Lưu thông tin user vào socket
      socket.data.user = decoded;

      return next();
    } catch (error) {
      // Token lỗi hoặc hết hạn
      return next(new Error("Token không hợp lệ."));
    }
  });

  /**
    ============== Xử lý sự kiện khi có client kết nối thành công ==============
   */
  io.on("connection", async (socket) => {

    // Lấy user từ middleware
    const user = socket.data.user;

    // Kiểm tra có phải admin không
    const isAdmin = Number(user?.role || 0) === 1;

    try {

      // Nếu là admin
      if (isAdmin) {

        // Join room admins
        socket.join("admins");

      } else {

        /**
         * Nếu là user thường
         * Tự động lấy/tạo phòng support
         */
        const supportRoom =
          await getSupportRoomForUser({ user });

        // Join room chat của user
        socket.join(String(supportRoom.room.RoomID));

        // Gửi dữ liệu room và messages(nếu có) về client bằng event "chat:ready"
        socket.emit("chat:ready", supportRoom);
      }

    } catch (error) {

      // Báo lỗi cho client
      socket.emit("chat:error", {
        message: error.message || "Không thể khởi tạo chat.",
      });
    }

    /**
     =========== Xử lý sự kiện tham gia phòng chat ===========
     */
    socket.on("chat:join", async (payload = {}, ack) => {

      try {

        // 1. Lấy roomId từ payload
        const roomId = getRoomIdFromPayload(payload);

        // Không có roomId
        if (!roomId) {
          throw new Error("Thiếu mã phòng chat.");
        }

        // Nếu socket chưa join room này thì đây là lần tham gia thực sự;
        // nếu socket đã ở trong room và client truyền `before` thì đây là yêu cầu paginated (tải tin nhắn cũ)
        const alreadyInRoom = socket.rooms.has(String(roomId));

        // Nếu client chưa ở trong room thì đánh dấu đã xem (cho admin) và join
        if (!alreadyInRoom) {
          if (isAdmin) {
            await markSeen({ roomId, user });
          }
        }

        // Hỗ trợ param `before` và `limit` để tải tin nhắn cũ
        const before = payload?.before || null;
        const limit = Number(payload?.limit || 100);

        // Lấy chi tiết room (và tin nhắn theo yêu cầu)
        const data = await getRoomDetail({ roomId, user, before, limit })
        // Nếu đây là lần join thực sự thì join socket và emit chat:joined
        if (!alreadyInRoom) {
          socket.join(String(roomId));
          socket.emit("chat:joined", data);

          if (isAdmin) {
            io.to(String(roomId)).emit("chat:seen-updated", {
              roomId,
              viewerId: user.id,
            });
          }
        }

        // Gửi ACK cho client (trong trường hợp paginated vẫn trả về messages)
        if (typeof ack === "function") {
          ack({
            success: true,
            ...data,
          });
        }

      } catch (error) {

        // Callback lỗi
        if (typeof ack === "function") {
          ack({
            success: false,
            message:
              error.message ||
              "Không thể tham gia phòng chat.",
          });
        }

        // Emit lỗi cho client
        socket.emit("chat:error", {
          message:
            error.message ||
            "Không thể tham gia phòng chat.",
        });
      }
    });

    /**
     * Event gửi tin nhắn
     */
    socket.on("chat:send", async (payload = {}, ack) => {

      try {

        // Lấy roomId
        const roomId = getRoomIdFromPayload(payload);

        /**
         * Lưu tin nhắn vào database
         */
        const message =
          await sendMessage({
            roomId,
            user,
            messageText: payload.messageText,
            messageType:
              payload.messageType || "text",
          });

        // Lấy thông tin room mới nhất
        const room =
          await getRoomById(roomId);

        // Payload broadcast
        const broadcastPayload = {
          ...message,
          room,
          senderRole: Number(user?.role || 0),
        };

        /**
         * Gửi tin nhắn realtime
         * tới tất cả client trong room
         */
        io.to(String(roomId)).emit(
          "chat:message",
          broadcastPayload
        );

        // Gửi thông báo riêng cho admin để họ nghe tiếng ngay cả khi chưa mở room
        // Chỉ gửi với tin nhắn từ user, tránh lặp khi admin tự gửi tin
        if (Number(user?.role || 0) !== 1) {
          io.to("admins").emit("chat:admin-notify", broadcastPayload);
        }

        /**
         * Update room list cho admin
         */
        io.to("admins").emit(
          "chat:room-updated",
          {
            room: room
              ? {
                  RoomID: room.RoomID,
                  RoomType: room.RoomType,
                  RoomKey: room.RoomKey,
                  CreatedBy: room.CreatedBy,
                  CreatedAt: room.CreatedAt,
                  UpdatedAt: room.UpdatedAt,
                  LastMessageAt: room.LastMessageAt,
                  IsClosed: room.IsClosed,
                }
              : null,
          }
        );

        // ACK thành công
        if (typeof ack === "function") {
          ack({
            success: true,
            data: broadcastPayload,
          });
        }

      } catch (error) {

        // ACK lỗi
        if (typeof ack === "function") {
          ack({
            success: false,
            message:
              error.message ||
              "Không thể gửi tin nhắn.",
          });
        }
      }
    });

    /**
     * Event đánh dấu đã xem
     */
    socket.on("chat:seen", async (payload = {}) => {

      try {

        // Lấy roomId
        const roomId = getRoomIdFromPayload(payload);

        // Không có roomId
        if (!roomId) return;

        /**
         * Update trạng thái seen trong DB
         */
        await markSeen({
          roomId,
          user,
        });

        /**
         * Broadcast trạng thái seen
         */
        io.to(String(roomId)).emit(
          "chat:seen-updated",
          {
            roomId,
            viewerId: user.id,
          }
        );

      } catch (error) {

        // Emit lỗi
        socket.emit("chat:error", {
          message:
            error.message ||
            "Không thể cập nhật trạng thái đã xem.",
        });
      }
    });
  });
};
