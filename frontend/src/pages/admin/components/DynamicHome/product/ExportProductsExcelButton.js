import React, { useCallback } from "react";
import ExcelJS from "exceljs";

const ExportProductsExcelButton = ({
  products,
  className = "btn-export",
  children = "Xuất Excel",
}) => {
  const handleExportExcel = useCallback(async () => {
    if (!products.length) {
      alert("Không có dữ liệu sản phẩm để xuất.");
      return;
    }

    const exportRows = products.map((product, index) => {
      const cleanedProduct = Object.entries(product).reduce((acc, [key, value]) => {
        if (key.toLowerCase().includes("image")) return acc;
        acc[key] = value;
        return acc;
      }, {});

      return {
        STT: index + 1,
        ...cleanedProduct,
      };
    });

    const preferredColumnsOrder = [
      "STT",
      "ProductID",
      "Barcode",
      "ProductName",
      "Type",
      "CategoryName",
      "SubCategoryName",
      "Price",
      "sale_price",
      "StockQuantity",
      "SupplierID",
      "isHot",
      "IsHidden",
      "start_date",
      "end_date",
      "discountPercent",
      "discountTimeLeft",
    ];

    const columnLabels = {
      STT: "STT",
      ProductID: "Mã sản phẩm",
      Barcode: "Mã vạch",
      ProductName: "Tên sản phẩm",
      Type: "Loại sản phẩm",
      CategoryName: "Danh mục",
      SubCategoryName: "Danh mục con",
      Price: "Giá",
      sale_price: "Giá khuyến mãi",
      StockQuantity: "Số lượng tồn kho",
      SupplierID: "Nhà cung cấp",
      isHot: "Sản phẩm hot",
      IsHidden: "Ẩn hiện",
      start_date: "Ngày bắt đầu sale",
      end_date: "Ngày kết thúc sale",
      discountPercent: "Phần trăm giảm giá",
      discountTimeLeft: "Thời gian còn lại",
    };

    const existingKeys = Object.keys(exportRows[0] || {});
    const orderedKeys = [
      ...preferredColumnsOrder.filter((key) => existingKeys.includes(key)),
    ];

    const today = new Date().toISOString().slice(0, 10);
    const reportDate = new Date().toLocaleString("vi-VN");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sản phẩm");

    const lastColumnLetter =
      worksheet.getColumn(Math.max(orderedKeys.length, 1)).letter || "A";

    const titleRow = worksheet.addRow(["DANH SÁCH SẢN PHẨM"]);
    titleRow.font = {
      bold: true,
      size: 20,
      color: { argb: "FF1F2937" },
      name: "Calibri",
    };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.mergeCells(`A1:${lastColumnLetter}1`);
    worksheet.getRow(1).height = 30;

    const metaRow1 = worksheet.addRow([`Ngày xuất: ${reportDate}`]);
    metaRow1.font = { size: 11, color: { argb: "FF6B7280" } };
    worksheet.mergeCells("A2:C2");
    worksheet.getRow(2).height = 18;

    const metaRow2 = worksheet.addRow([
      `Tổng số sản phẩm: ${exportRows.length}`,
    ]);
    metaRow2.font = { size: 11, color: { argb: "FF6B7280" } };
    worksheet.mergeCells("A3:C3");
    worksheet.getRow(3).height = 18;

    worksheet.addRow([]);

    const columnHeaders = orderedKeys.map((key) => columnLabels[key] || key);
    const headerRow = worksheet.addRow(columnHeaders);

    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF374151" },
    };
    headerRow.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: false,
    };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
    });
    worksheet.getRow(5).height = 25;

    exportRows.forEach((exportRow, rowIndex) => {
      const rowData = orderedKeys.map((key) => {
        const value = exportRow[key];

        if (key === "Price" || key === "sale_price") {
          const numValue = Number(value) || 0;
          return numValue > 0 ? `${numValue.toLocaleString("vi-VN")}đ` : "";
        }

        if (key === "isHot" || key === "IsHidden") {
          return Number(value) === 1 || value === true ? "Có" : "Không";
        }

        if (key === "start_date" || key === "end_date") {
          if (!value) return "";
          const dateVal = new Date(value);
          return Number.isNaN(dateVal.getTime())
            ? String(value)
            : dateVal.toLocaleDateString("vi-VN");
        }

        return value ?? "";
      });

      const dataRow = worksheet.addRow(rowData);

      const bgColor = rowIndex % 2 === 0 ? "FFFFFFFF" : "FFF3F4F6";
      dataRow.eachCell((cell, colNum) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgColor },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
        cell.alignment = { vertical: "center", wrapText: true };

        const colKey = orderedKeys[colNum - 1];
        if (colKey === "ProductName" || colKey === "Price" || colKey === "sale_price") {
          cell.alignment = { horizontal: "right", vertical: "middle" };
        } else if (
          colKey === "STT" ||
          colKey === "isHot" ||
          colKey === "IsHidden" ||
          colKey === "StockQuantity" ||
          colKey === "CategoryName" ||
          colKey === "SubCategoryName" ||
          colKey === "Type" ||
          colKey === "SupplierID"
        ) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
      dataRow.height = 20;
    });

    const maxWidthByKey = {
      STT: 8,
      ProductID: 14,
      Barcode: 22,
      ProductName: 85,
      Type: 18,
      CategoryName: 20,
      SubCategoryName: 24,
      Price: 16,
      sale_price: 18,
      StockQuantity: 19,
      SupplierID: 16,
      isHot: 16,
      IsHidden: 12,
      start_date: 21,
      end_date: 21,
      discountPercent: 20,
      discountTimeLeft: 22,
    };

    orderedKeys.forEach((key, index) => {
      const headerText = String(columnLabels[key] || key);
      let maxLength = headerText.length;

      exportRows.forEach((row) => {
        const value = row[key];
        let displayText = "";

        if (key === "Price" || key === "sale_price") {
          const numValue = Number(value) || 0;
          displayText = numValue > 0 ? `${numValue.toLocaleString("vi-VN")}đ` : "";
        } else if (key === "isHot" || key === "IsHidden") {
          displayText = Number(value) === 1 || value === true ? "Có" : "Không";
        } else if (key === "start_date" || key === "end_date") {
          if (!value) {
            displayText = "";
          } else {
            const dateVal = new Date(value);
            displayText = Number.isNaN(dateVal.getTime())
              ? String(value)
              : dateVal.toLocaleDateString("vi-VN");
          }
        } else {
          displayText = String(value ?? "");
        }

        if (displayText.length > maxLength) maxLength = displayText.length;
      });

      const column = worksheet.getColumn(index + 1);
      const maxAllowed = maxWidthByKey[key] || 24;
      const minByHeader = headerText.length + 2;
      const minWidthByKey = {
        SubCategoryName: 18,
      };
      const minAllowed = Math.max(minByHeader, minWidthByKey[key] || 0);
      column.width = Math.min(Math.max(maxLength + 2, minAllowed), maxAllowed);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `danh-sach-san-pham-${today}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [products]);

  return (
    <button className={className} onClick={handleExportExcel}>
      {children}
    </button>
  );
};

export default ExportProductsExcelButton;
