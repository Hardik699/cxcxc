# PDF Function को Replace करने के Steps

## Step 1: File खोलें
`client/pages/RecipeDetail.tsx` file को open करें

## Step 2: Old Function को Delete करें
- Line **886** पर जाएं
- `const handlePrintRecipePDF = () => {` से शुरू होता है
- Line **1212** तक पूरा function select करें (closing `};` तक)
- Delete करें

## Step 3: New Function Paste करें
नीचे दिया गया नया function उसी जगह paste करें:

```typescript
const handlePrintRecipePDF = () => {
  if (!recipe) return;
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${recipe.name} - Recipe Card</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; font-size: 12px; padding: 40px; }

          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 24px 40px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .company-name { font-size: 28px; font-weight: 800; }
          .company-sub { font-size: 10px; opacity: 0.9; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase; }
          .doc-badge { background: rgba(255,255,255,0.25); padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; }
          .doc-date { font-size: 10px; opacity: 0.85; margin-top: 6px; }

          .title-band {
            background: #eff6ff;
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #dbeafe;
          }
          .recipe-name { font-size: 24px; font-weight: 800; color: #1e40af; text-transform: uppercase; }
          .recipe-code { background: #3b82f6; color: white; padding: 6px 18px; border-radius: 20px; font-size: 13px; font-weight: 700; }

          .info-section { background: white; padding: 30px 40px; border: 1px solid #e5e7eb; border-top: none; }
          .section-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
          .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; }
          .info-label { font-size: 9px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
          .info-value { font-size: 15px; font-weight: 700; color: #111827; }

          .rm-section { background: white; padding: 30px 40px; border: 1px solid #e5e7eb; border-top: none; }
          .rm-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
          .rm-table thead { background: #f9fafb; }
          .rm-table th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
          .rm-table td { padding: 14px 16px; font-size: 12px; color: #374151; }
          .rm-name { font-weight: 600; color: #111827; margin-bottom: 4px; }
          .rm-code { font-size: 10px; color: #9ca3af; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .total-row { background: #f9fafb; font-weight: 700; }

          .price-card {
            float: right;
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 16px 24px;
            text-align: center;
            margin-top: 20px;
            min-width: 200px;
          }
          .price-label { font-size: 10px; color: #1e40af; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
          .price-value { font-size: 24px; font-weight: 800; color: #1e40af; }
          .price-unit { font-size: 14px; font-weight: 600; color: #3b82f6; }

          .footer {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-top: 2px solid #3b82f6;
            border-radius: 0 0 12px 12px;
            padding: 16px 40px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #6b7280;
          }
          .footer-brand { font-weight: 700; }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; }
            @page { margin: 0; size: A4; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">🍬 HANURAM FOODS</div>
            <div class="company-sub">Premium Quality · Authentic Taste</div>
          </div>
          <div style="text-align: right;">
            <div class="doc-badge">📋 COMPLETE RECIPE DETAILS</div>
            <div class="doc-date">Generated: ${today}</div>
          </div>
        </div>

        <div class="title-band">
          <div class="recipe-name">${recipe.name}</div>
          <div class="recipe-code">${recipe.code}</div>
        </div>

        <div class="info-section">
          <div class="section-title">RECIPE DETAILS</div>
          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">Recipe Type</div>
              <div class="info-value">${recipe.recipeType === "sub" ? "Sub" : "Master"}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Batch Size</div>
              <div class="info-value">${recipe.batchSize} ${recipe.unitName}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Yield</div>
              <div class="info-value">${recipe.yield || recipe.batchSize}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Moisture %</div>
              <div class="info-value">${recipe.moisturePercentage || "—"}</div>
            </div>
          </div>
        </div>

        <div class="rm-section">
          <div class="section-title">RAW MATERIALS</div>
          <table class="rm-table">
            <thead>
              <tr>
                <th style="width: 35%;">
                  <span style="display: inline-block; width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; margin-right: 8px;"></span>
                  Raw Material
                </th>
                <th class="text-center" style="width: 12%;">
                  <span style="display: inline-block; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; margin-right: 6px;"></span>
                  Quantity
                </th>
                <th class="text-center" style="width: 10%;">
                  <span style="display: inline-block; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; margin-right: 6px;"></span>
                  Unit
                </th>
                <th style="width: 18%;">Vendor</th>
                <th class="text-right" style="width: 12%;">
                  <span style="display: inline-block; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; margin-right: 6px;"></span>
                  Unit Price
                </th>
                <th class="text-right" style="width: 13%;">
                  <span style="display: inline-block; width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; margin-right: 8px;"></span>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              ${recipe.items?.map(item => `
                <tr>
                  <td>
                    <div class="rm-name">${item.rawMaterialName}</div>
                    <div class="rm-code">${item.rawMaterialCode}</div>
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

          <div class="price-card">
            <div class="price-label">Price Per KG (Yield)</div>
            <div class="price-value">₹${recipe.pricePerUnit.toFixed(2)}<span class="price-unit">/${recipe.unitName}</span></div>
          </div>
          <div style="clear: both;"></div>
        </div>

        <div class="footer">
          <div class="footer-brand">🍬 HANURAM FOODS — Confidential Recipe Document</div>
          <div>${recipe.code} · ${today}</div>
        </div>

        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
```

## Step 4: Save करें
File को save करें (Ctrl+S)

## Done!
अब PDF में सिर्फ Recipe Details और Raw Materials table दिखेगा - कोई labour costs या packaging costs नहीं!
