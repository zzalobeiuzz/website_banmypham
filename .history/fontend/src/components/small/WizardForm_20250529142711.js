{step === 1 && (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      handleNext();
    }}
  >
    <h3>Thông tin tài khoản</h3>
    {["username", "email", "password"].map((field) =>
      field === "password" ? (
        <div
          key={field}
          style={{ position: "relative", width: "100%", maxWidth: 400 }}
        >
          <input
            className="input-field"
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            name="password"
            value={formData.account.password}
            onChange={(e) => handleChange(e, "account")}
            required
            style={{ paddingRight: 30 }}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              userSelect: "none",
              fontSize: 18,
              color: "#555",
            }}
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            👁️
          </span>
        </div>
      ) : (
        <input
          key={field}
          className="input-field"
          type="text"
          placeholder={field === "username" ? "Tên đăng nhập" : "Email"}
          name={field}
          value={formData.account[field]}
          onChange={(e) => handleChange(e, "account")}
          required
        />
      )
    )}

    <button type="submit" className="btn">
      Tiếp theo
    </button>
    {/* ... phần còn lại giữ nguyên */}
  </form>
)}
