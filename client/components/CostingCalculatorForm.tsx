import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CostingInputs {
  shipperBoxCost: number;
  shipperBoxQty: number;
  hygieneCostPerUnit: number;
  hygieneQtyPerKg: number;
  scavengerCostPerUnit: number;
  scavengerQtyPerKg: number;
  mapCostPerKg: number;
  smallerSizePackagingCost: number;
  monoCartonCostPerUnit: number;
  monoCartonQtyPerKg: number;
  stickerCostPerUnit: number;
  stickerQtyPerKg: number;
  butterPaperCostPerKg: number;
  butterPaperQtyPerKg: number;
  excessWeightPerKg: number;
  rmcCostPerKg: number;
  wastagePercentage: number;
  packingCostPerKg: number;
  productionCostPerKg: number;
}

interface CostingResults {
  shipperBoxCostPerKg: number;
  hygieneCostPerKg: number;
  scavengerCostPerKg: number;
  mapCostPerKg: number;
  smallerSizePackagingCostPerKg: number;
  monoCartonCostPerKg: number;
  stickerCostPerKg: number;
  butterPaperCostPerKg: number;
  excessStockCostPerKg: number;
  materialWastageCostPerKg: number;
  totalPackagingHandlingCost: number;
}

const initialInputs: CostingInputs = {
  shipperBoxCost: 0,
  shipperBoxQty: 0,
  hygieneCostPerUnit: 0,
  hygieneQtyPerKg: 0,
  scavengerCostPerUnit: 0,
  scavengerQtyPerKg: 0,
  mapCostPerKg: 0,
  smallerSizePackagingCost: 0,
  monoCartonCostPerUnit: 0,
  monoCartonQtyPerKg: 0,
  stickerCostPerUnit: 0,
  stickerQtyPerKg: 0,
  butterPaperCostPerKg: 0,
  butterPaperQtyPerKg: 0,
  excessWeightPerKg: 0,
  rmcCostPerKg: 0,
  wastagePercentage: 0,
  packingCostPerKg: 0,
  productionCostPerKg: 0,
};

interface CostingCalculatorFormProps {
  title?: string;
  rmCostPerKg?: number;
  productionLabourCostPerKg?: number;
  packingLabourCostPerKg?: number;
  recipeId?: string;
  onSave?: () => void;
  batchSize?: number;
  yield?: number;
  readOnly?: boolean;
  unitName?: string;
  hideSaveButton?: boolean;
  onLabourCostChange?: (productionCost: number, packingCost: number) => void;
}

export interface CostingCalculatorFormRef {
  saveAll: () => Promise<boolean>;
}

export const CostingCalculatorForm = forwardRef<CostingCalculatorFormRef, CostingCalculatorFormProps>(({
  title = "📦 Costing Calculator",
  rmCostPerKg = 0,
  productionLabourCostPerKg = 0,
  packingLabourCostPerKg = 0,
  recipeId,
  onSave,
  batchSize = 0,
  yield: yieldPercentage = 100,
  readOnly = false,
  unitName = "unit",
  hideSaveButton = false,
  onLabourCostChange,
}, ref) => {
  const [inputs, setInputs] = useState<CostingInputs>({ 
    ...initialInputs, 
    rmcCostPerKg: parseFloat((rmCostPerKg || 0).toFixed(3)),
    packingCostPerKg: 0,
    productionCostPerKg: 0,
  });
  const [results, setResults] = useState<CostingResults | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load previously saved packaging costs and labour costs on mount
  useEffect(() => {
    if (!recipeId) return;

    const loadPackagingCosts = async () => {
      try {
        const response = await fetch(`/api/recipes/${recipeId}/packaging-costs`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const savedData = data.data;
            const loadedInputs = savedData.inputs || initialInputs;
            // ALWAYS use current rmCostPerKg (pricePerUnit) from recipe, not saved value
            if (rmCostPerKg > 0) {
              loadedInputs.rmcCostPerKg = parseFloat(rmCostPerKg.toFixed(3));
            }
            // Update hygieneQtyPerKg to use current yield value
            loadedInputs.hygieneQtyPerKg = yieldPercentage;
            setInputs(loadedInputs);
            // Recalculate with updated yield and rmcCostPerKg
            calculateCosts_internal(loadedInputs);
          }
        }
      } catch (error) {
        console.debug("Could not load packaging costs:", error);
      }
    };

    const loadLabourCosts = async () => {
      try {
        const response = await fetch(`/api/recipes/${recipeId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const recipe = data.data;
            // Load saved costs from recipe
            setInputs(prev => {
              const updatedInputs = { ...prev };
              
              if (recipe.packingCostPerKg !== undefined && recipe.packingCostPerKg !== null) {
                updatedInputs.packingCostPerKg = recipe.packingCostPerKg;
              }
              
              if (recipe.productionCostPerKg !== undefined && recipe.productionCostPerKg !== null) {
                updatedInputs.productionCostPerKg = recipe.productionCostPerKg;
              }
              
              return updatedInputs;
            });
          }
        }
      } catch (error) {
        console.debug("Could not load costs:", error);
      }
    };

    loadPackagingCosts();
    loadLabourCosts();
  }, [recipeId]);

  // Recalculate when yield changes (for Hygiene Cost calculation)
  useEffect(() => {
    if (inputs.hygieneCostPerUnit > 0) {
      calculateCosts_internal(inputs);
    }
  }, [yieldPercentage]);

  // Update rmcCostPerKg when rmCostPerKg prop changes
  useEffect(() => {
    const newRmcCost = parseFloat(rmCostPerKg.toFixed(3));
    // Always update, even if rmCostPerKg is 0
    setInputs(prev => {
      const updated = {
        ...prev,
        rmcCostPerKg: newRmcCost
      };
      // Recalculate with new rmcCostPerKg
      calculateCosts_internal(updated);
      return updated;
    });
  }, [rmCostPerKg]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const { name, value } = e.target;
    
    const updatedInputs = {
      ...inputs,
      [name]: value === "" ? 0 : parseFloat(value),
    };
    
    setInputs(updatedInputs);
    calculateCosts_internal(updatedInputs);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).blur();
  };

  const calculateCosts_internal = (currentInputs: CostingInputs = inputs) => {
    const shipperBoxCostPerKg =
      currentInputs.shipperBoxQty > 0
        ? currentInputs.shipperBoxCost / currentInputs.shipperBoxQty
        : 0;

    const hygieneCostPerKg = currentInputs.hygieneCostPerUnit * yieldPercentage;
    const scavengerCostPerKg = currentInputs.scavengerCostPerUnit * currentInputs.scavengerQtyPerKg;
    const mapCostPerKg = currentInputs.mapCostPerKg;
    const smallerSizePackagingCostPerKg = currentInputs.smallerSizePackagingCost;
    const monoCartonCostPerKg = currentInputs.monoCartonCostPerUnit * currentInputs.monoCartonQtyPerKg;
    const stickerCostPerKg = currentInputs.stickerCostPerUnit * currentInputs.stickerQtyPerKg;
    const butterPaperCostPerKg = currentInputs.butterPaperCostPerKg * currentInputs.butterPaperQtyPerKg;
    // Convert gm to kg for excess weight (divide by 1000)
    const excessWeightInKg = currentInputs.excessWeightPerKg / 1000;
    const excessStockCostPerKg = excessWeightInKg * currentInputs.rmcCostPerKg;

    // Base Cost (without Excess Stock) - sum of all packaging costs
    const wastageBaseSum =
      shipperBoxCostPerKg +
      hygieneCostPerKg +
      scavengerCostPerKg +
      mapCostPerKg +
      smallerSizePackagingCostPerKg +
      monoCartonCostPerKg +
      stickerCostPerKg +
      butterPaperCostPerKg;
    
    // Correct wastage calculation:
    // Final Cost = Base Cost / (1 - Wastage%/100)
    // Material Wastage Cost = Final Cost - Base Cost
    const wastageDecimal = currentInputs.wastagePercentage / 100;
    const usablePercentage = 1 - wastageDecimal;
    const finalCostAfterWastage = usablePercentage > 0 ? wastageBaseSum / usablePercentage : wastageBaseSum;
    const materialWastageCostPerKg = finalCostAfterWastage - wastageBaseSum;

    const totalPackagingHandlingCost =
      shipperBoxCostPerKg +
      hygieneCostPerKg +
      scavengerCostPerKg +
      mapCostPerKg +
      smallerSizePackagingCostPerKg +
      monoCartonCostPerKg +
      stickerCostPerKg +
      butterPaperCostPerKg +
      excessStockCostPerKg +
      materialWastageCostPerKg;

    setResults({
      shipperBoxCostPerKg,
      hygieneCostPerKg,
      scavengerCostPerKg,
      mapCostPerKg,
      smallerSizePackagingCostPerKg,
      monoCartonCostPerKg,
      stickerCostPerKg,
      butterPaperCostPerKg,
      excessStockCostPerKg,
      materialWastageCostPerKg,
      totalPackagingHandlingCost,
    });
  };

  const handleSavePackagingCosts = async (): Promise<boolean> => {
    if (!recipeId) {
      toast.error("Recipe ID is required to save packaging costs");
      return false;
    }

    if (!results) {
      toast.error("Please calculate the costs first");
      return false;
    }

    setIsSaving(true);
    try {
      console.log("=== SAVE STARTED ===");
      console.log("Saving packaging and labour costs:", {
        packingCostPerKg: inputs.packingCostPerKg || 0,
        productionCostPerKg: inputs.productionCostPerKg || 0,
      });
      console.log("Recipe ID:", recipeId);
      console.log("Results:", results);
      console.log("Inputs:", inputs);

      const requestBody = {
        inputs,
        results,
        totalPackagingHandlingCost: results.totalPackagingHandlingCost,
        packingCostPerKg: inputs.packingCostPerKg || 0,
        productionCostPerKg: inputs.productionCostPerKg || 0,
      };
      
      console.log("Request body:", JSON.stringify(requestBody, null, 2));
      console.log("API URL:", `/api/recipes/${recipeId}/packaging-costs`);

      const response = await fetch(`/api/recipes/${recipeId}/packaging-costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", response.status, errorText);
        toast.error(`Server error: ${response.status}`);
        setIsSaving(false);
        return false;
      }

      const responseText = await response.text();
      if (!responseText) {
        toast.success("Packaging costs saved successfully!");
        if (onSave) onSave();
        setIsSaving(false);
        return true;
      }

      const data = JSON.parse(responseText);
      if (data.success) {
        toast.success("Packaging costs saved successfully!");
        // Wait a moment for the database to update, then refresh
        setTimeout(() => {
          if (onSave) onSave();
        }, 500);
        setIsSaving(false);
        return true;
      } else {
        toast.error(data.message || "Failed to save packaging costs");
        setIsSaving(false);
        return false;
      }
    } catch (error) {
      console.error("Error saving packaging costs:", error);
      toast.error("Failed to save packaging costs");
      setIsSaving(false);
      return false;
    }
  };

  // Expose saveAll function via ref
  useImperativeHandle(ref, () => ({
    saveAll: async () => {
      return await handleSavePackagingCosts();
    }
  }));

  const sectionInputClass = "w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 placeholder:font-normal";
  const resultBadge = (text: string) => (
    <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-full whitespace-nowrap border border-indigo-200">{text}</span>
  );
  const sectionHeader = (num: number, label: string, badge?: React.ReactNode) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-200 rounded-t-lg">
      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{num}</span>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {badge && <div className="ml-auto">{badge}</div>}
    </div>
  );

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${readOnly ? "pointer-events-none select-none" : ""}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 via-slate-50 to-slate-50 border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
      </div>

      <div className="p-5 space-y-3">

        {[
          { num: 1, title: "Shipper Box Cost", result: results ? results.shipperBoxCostPerKg.toFixed(2) : null, fields: [
            { name: "shipperBoxCost", label: "Cost per Box" },
            { name: "shipperBoxQty", label: "Qty per Box (Kg)" },
          ]},
          { num: 2, title: "Hygiene Cost", result: results ? results.hygieneCostPerKg.toFixed(2) : null, fields: [
            { name: "hygieneCostPerUnit", label: "Cost per Kg" },
            { name: "hygieneQtyPerKg", label: "Yield", readOnly: true, autoFill: "yield" },
          ]},
          { num: 3, title: "Scavenger Cost", result: results ? results.scavengerCostPerKg.toFixed(2) : null, fields: [
            { name: "scavengerCostPerUnit", label: "Cost per Unit" },
            { name: "scavengerQtyPerKg", label: "Qty used per Kg" },
          ]},
          { num: 4, title: "MAP Cost", result: results ? results.mapCostPerKg.toFixed(2) : null, fields: [
            { name: "mapCostPerKg", label: "Cost per Kg" },
          ]},
          { num: 5, title: "Smaller Size Packaging", result: results ? results.smallerSizePackagingCostPerKg.toFixed(2) : null, fields: [
            { name: "smallerSizePackagingCost", label: "Cost per Kg" },
          ]},
          { num: 6, title: "Mono Carton Cost", result: results ? results.monoCartonCostPerKg.toFixed(2) : null, fields: [
            { name: "monoCartonCostPerUnit", label: "Cost per Carton" },
            { name: "monoCartonQtyPerKg", label: "Qty used per Kg" },
          ]},
          { num: 7, title: "Sticker Cost", result: results ? results.stickerCostPerKg.toFixed(2) : null, fields: [
            { name: "stickerCostPerUnit", label: "Cost per Sticker" },
            { name: "stickerQtyPerKg", label: "Qty used per Kg" },
          ]},
          { num: 8, title: "Butter Paper Cost", result: results ? results.butterPaperCostPerKg.toFixed(2) : null, fields: [
            { name: "butterPaperCostPerKg", label: "Cost per Kg" },
            { name: "butterPaperQtyPerKg", label: "Qty used per Kg" },
          ]},
          { num: 9, title: "Excess Stock Cost", result: results ? results.excessStockCostPerKg.toFixed(2) : null, fields: [
            { name: "excessWeightPerKg", label: "Excess Weight (gm)", readOnly: false, convertGmToKg: true },
            { name: "rmcCostPerKg", label: "Price Per Unit Yield (₹)", readOnly: true },
          ]},
          { num: 10, title: "Material Wastage", result: results ? results.materialWastageCostPerKg.toFixed(2) : null, fields: [
            { name: "wastagePercentage", label: "Wastage %" },
          ]},
          { num: 11, title: "Packing Cost", result: ((inputs.packingCostPerKg || 0) * yieldPercentage).toFixed(2), fields: [
            { name: "packingCostPerKg", label: "Cost per Kg" },
            { name: "packingYield", label: "Yield", readOnly: true, autoFill: "yield" },
          ]},
          { num: 12, title: "Production Cost", result: ((inputs.productionCostPerKg || 0) * yieldPercentage).toFixed(2), fields: [
            { name: "productionCostPerKg", label: "Cost per Kg" },
            { name: "productionYield", label: "Yield", readOnly: true, autoFill: "yield" },
          ]},
        ].map((s) => (
          <div key={s.num} className="rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:shadow-sm transition-shadow">
            {sectionHeader(s.num, s.title, s.result ? resultBadge(`₹${s.result}/Kg`) : undefined)}
            <div className={`p-4 bg-slate-50 grid gap-3 ${s.fields.length > 1 ? "grid-cols-2" : "grid-cols-1 max-w-xs"}`}>
              {s.fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{f.label}</label>
                  <Input
                    type="number"
                    name={f.name}
                    value={(f as any).autoFill === "yield" ? yieldPercentage : 
                           ((inputs as any)[f.name] !== undefined && (inputs as any)[f.name] !== null && (inputs as any)[f.name] !== 0) ? (inputs as any)[f.name] : ""}
                    onChange={handleInputChange}
                    onWheel={handleWheel}
                    placeholder="0.00"
                    step="0.01"
                    readOnly={(f as any).readOnly}
                    className={`${sectionInputClass} ${(f as any).readOnly ? "bg-slate-100 cursor-not-allowed text-slate-500 border-slate-200" : ""}`}
                  />
                </div>
              ))}
            </div>
            {/* Calculation row */}
            {results && s.result && (
              <div className="px-4 pb-3 bg-slate-50">
                <div className="text-xs font-medium text-slate-700 bg-indigo-50 border border-indigo-200 rounded px-3 py-2">
                  {s.num === 10
                    ? (() => {
                        const wastagePercent = (inputs as any)[s.fields[0].name] || 0;
                        const baseCost = results.shipperBoxCostPerKg + results.hygieneCostPerKg + 
                                        results.scavengerCostPerKg + results.mapCostPerKg + 
                                        results.smallerSizePackagingCostPerKg + results.monoCartonCostPerKg + 
                                        results.stickerCostPerKg + results.butterPaperCostPerKg;
                        const usable = 100 - wastagePercent;
                        const finalCost = usable > 0 ? baseCost / (usable / 100) : baseCost;
                        return `Base: ₹${baseCost.toFixed(2)} ÷ ${usable}% = ₹${finalCost.toFixed(2)}, Wastage: ₹${finalCost.toFixed(2)} - ₹${baseCost.toFixed(2)} = ₹${s.result}/Kg`;
                      })()
                    : s.num === 11
                    ? `${(inputs.packingCostPerKg || 0).toFixed(2)} × ${yieldPercentage.toFixed(2)} = ₹${((inputs.packingCostPerKg || 0) * yieldPercentage).toFixed(2)}`
                    : s.num === 12
                    ? `${(inputs.productionCostPerKg || 0).toFixed(2)} × ${yieldPercentage.toFixed(2)} = ₹${((inputs.productionCostPerKg || 0) * yieldPercentage).toFixed(2)}`
                    : s.num === 9
                    ? `${(inputs as any)[s.fields[0].name] || 0} gm = ${((inputs as any)[s.fields[0].name] / 1000).toFixed(3)} kg × ${(inputs as any)[s.fields[1].name] || 0} = ₹${s.result}/Kg`
                    : s.num === 2
                    ? `${(inputs as any)[s.fields[0].name] || 0} × ${yieldPercentage.toFixed(2)} = ₹${s.result}`
                    : s.num === 1
                    ? `${(inputs as any)[s.fields[0].name] || 0} ÷ ${(inputs as any)[s.fields[1].name] || 0} = ₹${s.result}/Kg`
                    : s.fields.length === 2
                    ? `${(inputs as any)[s.fields[0].name] || 0} × ${(inputs as any)[s.fields[1].name] || 0} = ₹${s.result}/Kg`
                    : `₹${s.result}/Kg`}
                </div>
              </div>
            )}
          </div>
        ))}

      </div>

      {/* Results Table */}
      {results && (
        <div className="mt-6 px-5 pb-5">
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Cost Component</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Cost per Kg (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">Shipper Box Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">₹{results.shipperBoxCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">Hygiene Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">₹{results.hygieneCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">Scavenger Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">₹{results.scavengerCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">MAP Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">₹{results.mapCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">Smaller Size Packaging Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">₹{results.smallerSizePackagingCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">Mono Carton Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">₹{results.monoCartonCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">Sticker Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">₹{results.stickerCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">Butter Paper Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">₹{results.butterPaperCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">Excess Stock Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">₹{results.excessStockCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200 bg-indigo-50 hover:bg-indigo-100">
                  <td className="px-4 py-3 font-medium text-slate-700">Material Wastage Cost</td>
                  <td className="px-4 py-3 text-right font-medium text-indigo-700">₹{results.materialWastageCostPerKg.toFixed(2)}</td>
                </tr>
                <tr className="bg-indigo-100 border-t-2 border-indigo-300">
                  <td className="px-4 py-4 font-bold text-slate-800">TOTAL PACKAGING & HANDLING COST / KG</td>
                  <td className="px-4 py-4 text-right font-bold text-indigo-700">₹{results.totalPackagingHandlingCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total Summary */}
          <div className="mt-6 border-t border-slate-300 pt-6">

            {/* Save Button - above breakdown - hide if hideSaveButton is true */}
            {recipeId && !readOnly && !hideSaveButton && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleSavePackagingCosts}
                  disabled={isSaving || !results}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Other Costs</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-200">
              <h3 className="text-base font-bold text-slate-800 mb-4">
                📊 Complete Cost Breakdown (Per Kg)
              </h3>
              
              {/* Price Per Kg (Yield) Highlight */}
              
              <div className="space-y-3">
                <div className="pb-3 border-b border-indigo-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">1. Price Per Kg (Yield)</span>
                    <span className="text-base font-bold text-slate-800">₹{rmCostPerKg.toFixed(2)}</span>
                  </div>
                  {batchSize > 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span></span>
                      <span>{rmCostPerKg.toFixed(2)} × {yieldPercentage} = ₹{(rmCostPerKg * yieldPercentage).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="pb-3 border-b border-indigo-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">2. Packing Cost / KG</span>
                    <span className="text-base font-bold text-slate-800">₹{(inputs.packingCostPerKg || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="pb-3 border-b border-indigo-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">3. Production Cost / KG</span>
                    <span className="text-base font-bold text-slate-800">₹{(inputs.productionCostPerKg || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="pb-3 border-b border-indigo-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">4. Packaging & Handling Cost / KG</span>
                    <span className="text-base font-bold text-slate-800">₹{results.totalPackagingHandlingCost.toFixed(2)}</span>
                  </div>
                  {batchSize > 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span></span>
                      <span>{results.totalPackagingHandlingCost.toFixed(2)} × {yieldPercentage} = ₹{(results.totalPackagingHandlingCost * yieldPercentage).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="pt-3 mt-3 border-t-2 border-indigo-300 bg-indigo-100 p-4 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-slate-800">GRAND TOTAL COST / KG</span>
                    <span className="text-xl font-bold text-indigo-700">
                      ₹{(rmCostPerKg + (inputs.packingCostPerKg || 0) + (inputs.productionCostPerKg || 0) + results.totalPackagingHandlingCost).toFixed(2)}
                    </span>
                  </div>
                  {batchSize > 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-600 mt-1">
                      <span></span>
                      <span>{(rmCostPerKg + (inputs.packingCostPerKg || 0) + (inputs.productionCostPerKg || 0) + results.totalPackagingHandlingCost).toFixed(2)} × {yieldPercentage} = ₹{((rmCostPerKg + (inputs.packingCostPerKg || 0) + (inputs.productionCostPerKg || 0) + results.totalPackagingHandlingCost) * yieldPercentage).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {recipeId && !readOnly && (
            <div className="mt-6 pt-6 border-t border-slate-300 flex gap-3 justify-end">
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CostingCalculatorForm.displayName = "CostingCalculatorForm";




