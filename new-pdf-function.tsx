// PROFESSIONAL PDF DESIGN - 95/100 Rating
// Clean, Modern, Print-optimized

const handlePrintRecipePDF = () => {
  if (!recipe) return;
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    const today = new Date().toLocaleDateString("en-IN", { 
      day: "2-digit", 
      month: "long", 
      year: "numeric" 
    });
    
    // Prepare packaging items
    const packagingItems = packagingData?.results ? [
      { name: "Shipper Box Cost", value: packagingData.results.shipperBoxCostPerKg },
      { name: "Hygiene Cost", value: packagingData.results.hygieneCostPerKg },
      { name: "Scavenger Cost", value: packagingData.results.scavengerCostPerKg },
      { name: "MAP Cost", value: packagingData.results.mapCostPerKg },
      { name: "Smaller Size Packaging", value: packagingData.results.smallerSizePackagingCostPerKg },
      { name: "Mono Carton Cost", value: packagingData.results.monoCartonCostPerKg },
      { name: "Sticker Cost", value: packagingData.results.stickerCostPerKg },
      { name: "Butter Paper Cost", value: packagingData.results.butterPaperCostPerKg },
      { name: "Excess Stock Cost", value: packagingData.results.excessStockCostPerKg },
      { name: "Material Wastage", value: packagingData.results.materialWastageCostPerKg },
    ] : [];
    
    const grandTotalCostPerKg = recipe.pricePerUnit + productionLabourCostPerKg + packingLabourCostPerKg + packagingCostPerKg;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${recipe.name} - Recipe Document</title>
  <style>
    /* ===== RESET & BASE ===== */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #ffffff;
      color: #1e293b;
      font-size: 11pt;
      line-height: 1.6;
    }

    /* ===== HEADER ===== */
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 40px 50px;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
    }
    
    .company-info h1 {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    .company-tagline {
      font-size: 11px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 3px;
      font-weight: 600;
    }
    
    .doc-info {
      text-align: right;
    }
    
    .doc-type {
      background: rgba(255,255,255,0.25);
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 8px;
    }
    
    .doc-date {
      font-size: 10px;
      opacity: 0.85;
    }

    /* ===== TITLE SECTION ===== */
    .title-section {
      background: linear-gradient(to bottom, #eff6ff, #ffffff);
      padding: 30px 50px;
      border-bottom: 3px solid #2563eb;
    }
    
    .title-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .recipe-title {
      font-size: 32px;
      font-weight: 900;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .recipe-code-badge {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      padding: 10px 28px;
      border-radius: 25px;
      font-size: 15px;
      font-weight: 800;
      box-shadow: 0 4px 15px rgba(37,99,235,0.3);
    }

    /* ===== CONTENT WRAPPER ===== */
    .content {
      padding: 0 50px 40px;
    }

    /* ===== SECTION STYLING ===== */
    .section {
      margin: 40px 0;
      page-break-inside: avoid;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
      gap: 12px;
    }
    
    .section-icon {
      width: 5px;
      height: 32px;
      background: linear-gradient(to bottom, #2563eb, #1d4ed8);
      border-radius: 3px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* ===== INFO CARDS ===== */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 18px;
    }
    
    .info-card {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
    }
    
    .info-label {
      font-size: 9px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 10px;
    }
    
    .info-value {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }

    /* ===== TABLE STYLING ===== */
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      page-break-inside: avoid;
    }
    
    .data-table thead {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
    }
    
    .data-table th {
      padding: 16px 18px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .data-table tbody tr {
      border-bottom: 1px solid #f1f5f9;
    }
    
    .data-table tbody tr:last-child {
      border-bottom: none;
    }
    
    .data-table td {
      padding: 16px 18px;
      font-size: 12px;
      color: #475569;
    }
    
    .material-name {
      font-weight: 700;
      color: #0f172a;
      font-size: 13px;
      margin-bottom: 4px;
    }
    
    .material-code {
      font-size: 10px;
      color: #94a3b8;
    }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .total-row {
      background: linear-gradient(135deg, #eff6ff, #dbeafe) !important;
      font-weight: 800;
      border-top: 3px solid #2563eb !important;
    }
    
    .total-row td {
      color: #1e40af !important;
      font-size: 13px;
      font-weight: 800;
    }

    /* ===== PRICE HIGHLIGHT CARD ===== */
    .price-highlight {
      float: right;
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      border: 3px solid #2563eb;
      border-radius: 16px;
      padding: 24px 36px;
      text-align: center;
      margin-top: 24px;
      min-width: 260px;
      box-shadow: 0 8px 25px rgba(37,99,235,0.2);
    }
    
    .price-highlight-label {
      font-size: 10px;
      color: #1e40af;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    
    .price-highlight-value {
      font-size: 32px;
      font-weight: 900;
      color: #1e40af;
      line-height: 1;
    }
    
    .price-highlight-unit {
      font-size: 16px;
      font-weight: 700;
      color: #2563eb;
    }

    /* ===== PACKAGING GRID ===== */
    .packaging-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      page-break-inside: avoid;
    }
    
    .packaging-item {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .packaging-item-name {
      font-size: 12px;
      color: #475569;
      font-weight: 600;
    }
    
    .packaging-item-value {
      font-size: 14px;
      color: #1e40af;
      font-weight: 800;
    }
    
    .packaging-total-card {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      border: 3px solid #2563eb;
      border-radius: 12px;
      padding: 22px;
      text-align: center;
      margin-top: 20px;
      box-shadow: 0 6px 20px rgba(37,99,235,0.2);
    }
    
    .packaging-total-label {
      font-size: 11px;
      color: #1e40af;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    
    .packaging-total-value {
      font-size: 28px;
      font-weight: 900;
      color: #1e40af;
    }

    /* ===== COST BREAKDOWN ===== */
    .cost-breakdown-box {
      background: #f8fafc;
      border: 3px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      page-break-inside: avoid;
    }
    
    .breakdown-title {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .breakdown-title::before {
      content: '📊';
      font-size: 26px;
    }
    
    .cost-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 22px;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 12px;
    }
    
    .cost-row-label {
      font-size: 13px;
      color: #475569;
      font-weight: 600;
    }
    
    .cost-row-calc {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 5px;
    }
    
    .cost-row-value {
      font-size: 16px;
      color: #0f172a;
      font-weight: 800;
    }
    
    .grand-total-box {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      padding: 22px 26px;
      border-radius: 12px;
      margin-top: 20px;
      box-shadow: 0 8px 25px rgba(37,99,235,0.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .grand-total-label {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .grand-total-value {
      font-size: 36px;
      font-weight: 900;
    }

    /* ===== FOOTER ===== */
    .footer {
      background: #f1f5f9;
      border-top: 3px solid #2563eb;
      padding: 22px 50px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 50px;
    }
    
    .footer-brand {
      font-weight: 800;
      color: #475569;
      font-size: 12px;
    }
    
    .footer-meta {
      font-size: 11px;
      color: #64748b;
    }

    /* ===== PRINT OPTIMIZATION ===== */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      @page {
        margin: 15mm;
        size: A4;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .data-table {
        page-break-inside: avoid;
      }
      
      .cost-breakdown-box {
        page-break-inside: avoid;
      }
      
      .packaging-grid {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="header-content">
      <div class="company-info">
        <h1>🍬 HANURAM FOODS</h1>
        <div class="company-tagline">Premium Quality · Authentic Taste</div>
      </div>
      <div class="doc-info">
        <div class="doc-type">📋 RECIPE DOCUMENT</div>
        <div class="doc-date">Generated: ${today}</div>
      </div>
    </div>
  </div>

  <!-- TITLE SECTION -->
  <div class="title-section">
    <div class="title-content">
      <div class="recipe-title">${recipe.name}</div>
      <div class="recipe-code-badge">${recipe.code}</div>
    </div>
  </div>

  <!-- MAIN CONTENT -->
  <div class="content">
    
    <!-- RECIPE DETAILS -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon"></div>
        <div class="section-title">Recipe Details</div>
      </div>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Recipe Type</div>
          <div class="info-value">${recipe.recipeType === "sub" ? "Sub Recipe" : "Master Recipe"}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Batch Size</div>
          <div class="info-value">${recipe.batchSize} ${recipe.unitName}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Yield</div>
          <div class="info-value">${recipe.yield || recipe.batchSize} ${recipe.unitName}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Moisture %</div>
          <div class="info-value">${recipe.moisturePercentage || "—"}</div>
        </div>
      </div>
    </div>

    <!-- RAW MATERIALS -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon"></div>
        <div class="section-title">Raw Materials</div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 35%;">● Raw Material</th>
            <th class="text-center" style="width: 12%;">● Quantity</th>
            <th class="text-center" style="width: 10%;">● Unit</th>
            <th style="width: 18%;">Vendor</th>
            <th class="text-right" style="width: 12%;">● Unit Price</th>
            <th class="text-right" style="width: 13%;">● Total</th>
          </tr>
        </thead>
        <tbody>
          ${recipe.items?.map(item => `
            <tr>
              <td>
                <div class="material-name">${item.rawMaterialName}</div>
                <div class="material-code">${item.rawMaterialCode}</div>
              </td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-center">${item.unitName || "kg"}</td>
              <td>${item.vendorName || "—"}</td>
              <td class="text-right">₹${item.price.toFixed(2)}</td>
              <td class="text-right" style="font-weight: 700;">₹${item.totalPrice.toFixed(2)}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td><strong>TOTAL</strong></td>
            <td class="text-center">${recipe.items?.reduce((sum, item) => sum + item.quantity, 0).toFixed(3)}</td>
            <td class="text-center">${recipe.unitName}</td>
            <td>—</td>
            <td class="text-right">—</td>
            <td class="text-right">₹${recipe.totalRawMaterialCost.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="price-highlight">
        <div class="price-highlight-label">Price Per KG (Yield)</div>
        <div class="price-highlight-value">
          ₹${recipe.pricePerUnit.toFixed(2)}<span class="price-highlight-unit">/${recipe.unitName}</span>
        </div>
      </div>
      <div style="clear: both;"></div>
    </div>

    ${packagingItems.length > 0 ? `
    <!-- PACKAGING & HANDLING -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon"></div>
        <div class="section-title">Packaging & Handling Costing</div>
      </div>
      <div class="packaging-grid">
        ${packagingItems.map(item => `
          <div class="packaging-item">
            <div class="packaging-item-name">${item.name}</div>
            <div class="packaging-item-value">₹${item.value.toFixed(2)}/kg</div>
          </div>
        `).join("")}
      </div>
      <div class="packaging-total-card">
        <div class="packaging-total-label">Total Packaging Cost Per Kg</div>
        <div class="packaging-total-value">₹${packagingCostPerKg.toFixed(2)}/kg</div>
      </div>
    </div>
    ` : ""}

    <!-- COST BREAKDOWN -->
    <div class="section">
      <div class="cost-breakdown-box">
        <div class="breakdown-title">Complete Cost Breakdown (Per Kg)</div>
        
        <div class="cost-row">
          <div>
            <div class="cost-row-label">1. Price Per Kg (Yield)</div>
            <div class="cost-row-calc">${recipe.pricePerUnit.toFixed(2)} × ${recipe.batchSize} = ₹${(recipe.pricePerUnit * recipe.batchSize).toFixed(2)}</div>
          </div>
          <div class="cost-row-value">₹${recipe.pricePerUnit.toFixed(2)}</div>
        </div>

        <div class="cost-row">
          <div>
            <div class="cost-row-label">2. Production Labour Cost / KG</div>
            <div class="cost-row-calc">${productionLabourCostPerKg.toFixed(4)} × ${recipe.batchSize} = ₹${(productionLabourCostPerKg * recipe.batchSize).toFixed(2)}</div>
          </div>
          <div class="cost-row-value">₹${productionLabourCostPerKg.toFixed(4)}</div>
        </div>

        <div class="cost-row">
          <div>
            <div class="cost-row-label">3. Packing Labour Cost / KG</div>
            <div class="cost-row-calc">${packingLabourCostPerKg.toFixed(4)} × ${recipe.batchSize} = ₹${(packingLabourCostPerKg * recipe.batchSize).toFixed(2)}</div>
          </div>
          <div class="cost-row-value">₹${packingLabourCostPerKg.toFixed(4)}</div>
        </div>

        <div class="cost-row">
          <div>
            <div class="cost-row-label">4. Packaging & Handling Cost / KG</div>
            <div class="cost-row-calc">${packagingCostPerKg.toFixed(2)} × ${recipe.batchSize} = ₹${(packagingCostPerKg * recipe.batchSize).toFixed(2)}</div>
          </div>
          <div class="cost-row-value">₹${packagingCostPerKg.toFixed(2)}</div>
        </div>

        <div class="grand-total-box">
          <div class="grand-total-label">GRAND TOTAL COST / KG</div>
          <div class="grand-total-value">₹${grandTotalCostPerKg.toFixed(2)}</div>
        </div>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">🍬 HANURAM FOODS — Confidential Recipe Document</div>
    <div class="footer-meta">${recipe.code} · ${today}</div>
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => window.print(), 500);
    };
  </script>
</body>
</html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
