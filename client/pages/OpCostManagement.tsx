import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  Plus,
  Edit2,
  Trash2,
  Calculator,
  Package,
  History,
  TrendingUp,
  DollarSign,
  Zap,
  Truck,
  Shield,
  Car,
  Plane,
  Wrench,
  Wifi,
  Phone,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ProfessionalPage, EmptyState } from "@/components/ProfessionalPage";
import { DataTable } from "@/components/DataTable";

interface OpCostData {
  _id?: string;
  month: string;
  year: number;
  costs: {
    rent: number;
    fixedSalary: number;
    electricity: number;
    marketing: number;
    logistics: number;
    insurance: number;
    vehicleInstallments: number;
    travelCost: number;
    miscellaneous: number;
    otherCosts: number;
    equipmentMaintenance: number;
    internetCharges: number;
    telephoneBills: number;
  };
  production: {
    mithaiProduction: number;
    namkeenProduction: number;
  };
  autoOpCostPerKg: number;
  manualOpCostPerKg?: number;
  useManualOpCost: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  editLog?: Array<{
    timestamp: string;
    editedBy: string;
    changes: Record<string, { from: any; to: any }>;
  }>;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const costFields = [
  { key: "rent", label: "Rent", icon: DollarSign },
  { key: "fixedSalary", label: "Fixed Salary", icon: DollarSign },
  { key: "electricity", label: "Electricity", icon: Zap },
  { key: "marketing", label: "Marketing", icon: TrendingUp },
  { key: "logistics", label: "Logistics", icon: Truck },
  { key: "insurance", label: "Insurance", icon: Shield },
  { key: "vehicleInstallments", label: "Vehicle EMI", icon: Car },
  { key: "travelCost", label: "Travel", icon: Plane },
  { key: "equipmentMaintenance", label: "Maintenance", icon: Wrench },
  { key: "internetCharges", label: "Internet", icon: Wifi },
  { key: "telephoneBills", label: "Telephone", icon: Phone },
  { key: "miscellaneous", label: "Miscellaneous", icon: MoreHorizontal },
];

export default function OpCostManagement() {
  const [opCosts, setOpCosts] = useState<OpCostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logOpCost, setLogOpCost] = useState<OpCostData | null>(null);

  const [formData, setFormData] = useState({
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().getFullYear(),
    costs: {
      rent: 0,
      fixedSalary: 0,
      electricity: 0,
      marketing: 0,
      logistics: 0,
      insurance: 0,
      vehicleInstallments: 0,
      travelCost: 0,
      miscellaneous: 0,
      otherCosts: 0,
      equipmentMaintenance: 0,
      internetCharges: 0,
      telephoneBills: 0,
    },
    production: {
      mithaiProduction: 0,
      namkeenProduction: 0,
    },
  });

  useEffect(() => {
    fetchOpCosts();
  }, []);

  const fetchOpCosts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/op-costs");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.success) {
        setOpCosts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching OP costs:", error);
      toast.error("Failed to load OP costs");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("cost_")) {
      const costKey = name.replace("cost_", "");
      setFormData((prev) => ({
        ...prev,
        costs: {
          ...prev.costs,
          [costKey]: value === "" ? 0 : parseFloat(value),
        },
      }));
    } else if (name.startsWith("prod_")) {
      const prodKey = name.replace("prod_", "");
      setFormData((prev) => ({
        ...prev,
        production: {
          ...prev.production,
          [prodKey]: value === "" ? 0 : parseFloat(value),
        },
      }));
    } else if (name === "month") {
      setFormData((prev) => ({ ...prev, month: value }));
    } else if (name === "year") {
      setFormData((prev) => ({ ...prev, year: parseInt(value) }));
    }
  };

  const handleSave = async () => {
    try {
      const username = localStorage.getItem("username") || "admin";
      
      const payload = {
        ...formData,
        createdBy: username,
        editedBy: username,
      };

      const response = await fetch(
        editingId ? `/api/op-costs/${editingId}` : "/api/op-costs",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(editingId ? "OP Cost updated" : "OP Cost created");
        setShowForm(false);
        setEditingId(null);
        setFormData({
          month: new Date().toLocaleString("default", { month: "long" }),
          year: new Date().getFullYear(),
          costs: {
            rent: 0,
            fixedSalary: 0,
            electricity: 0,
            marketing: 0,
            logistics: 0,
            insurance: 0,
            vehicleInstallments: 0,
            travelCost: 0,
            miscellaneous: 0,
            otherCosts: 0,
            equipmentMaintenance: 0,
            internetCharges: 0,
            telephoneBills: 0,
          },
          production: {
            mithaiProduction: 0,
            namkeenProduction: 0,
          },
        });
        fetchOpCosts();
      } else {
        toast.error(
          data.message ||
            `Failed to ${editingId ? "update" : "create"} OP cost`,
        );
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save OP cost");
    }
  };

  const handleEdit = (opCost: OpCostData) => {
    setFormData({
      month: opCost.month,
      year: opCost.year,
      costs: opCost.costs,
      production: opCost.production,
    });
    setEditingId(opCost._id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this OP cost entry?")) return;

    try {
      const username = localStorage.getItem("username") || "admin";
      
      const response = await fetch(`/api/op-costs/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deletedBy: username }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Deleted successfully");
        fetchOpCosts();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const calculateTotalCost = () => {
    return Object.values(formData.costs).reduce((sum, val) => sum + val, 0);
  };

  const calculateTotalKgs = () => {
    return (
      formData.production.mithaiProduction +
      formData.production.namkeenProduction
    );
  };

  const calculateOpCostPerKg = () => {
    const totalKgs = calculateTotalKgs();
    if (totalKgs === 0) return 0;
    return calculateTotalCost() / totalKgs;
  };

  return (
    <Layout>
      <ProfessionalPage
        title="Operational Cost (OP Cost)"
        description="Manage and track monthly operational costs and production metrics."
        headerAction={
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
              } else {
                setEditingId(null);
                setFormData({
                  month: new Date().toLocaleString("default", {
                    month: "long",
                  }),
                  year: new Date().getFullYear(),
                  costs: {
                    rent: 0,
                    fixedSalary: 0,
                    electricity: 0,
                    marketing: 0,
                    logistics: 0,
                    insurance: 0,
                    vehicleInstallments: 0,
                    travelCost: 0,
                    miscellaneous: 0,
                    otherCosts: 0,
                    equipmentMaintenance: 0,
                    internetCharges: 0,
                    telephoneBills: 0,
                  },
                  production: {
                    mithaiProduction: 0,
                    namkeenProduction: 0,
                  },
                });
                setShowForm(true);
              }
            }}
            className={showForm ? "prof-btn-secondary" : "prof-btn-primary"}
          >
            {showForm ? (
              <>
                <History size={16} />
                <span>View All Entries</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Add OP Cost</span>
              </>
            )}
          </button>
        }
      >
        {showForm ? (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Period Selection */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingId ? "Edit" : "Add"} OP Cost Entry
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Select the period for this entry
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                    Month
                  </label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                    Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>
            </div>

            {/* Operating Costs */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Monthly Operating Costs
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Enter all operational expenses for the month
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {costFields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <div
                      key={field.key}
                      className="group bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                          {field.label}
                        </label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          name={`cost_${field.key}`}
                          value={(formData.costs as any)[field.key] || ""}
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Production */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Monthly Production
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Enter total production in kilograms
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2 uppercase tracking-wide">
                    🍬 Mithai Production (Kg)
                  </label>
                  <input
                    type="number"
                    name="prod_mithaiProduction"
                    value={formData.production.mithaiProduction || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2 uppercase tracking-wide">
                    🥜 Namkeen Production (Kg)
                  </label>
                  <input
                    type="number"
                    name="prod_namkeenProduction"
                    value={formData.production.namkeenProduction || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <TrendingUp className="w-5 h-5" />
                Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700 shadow-sm">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1 uppercase tracking-wide">
                    Total Cost
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    ₹{calculateTotalCost().toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700 shadow-sm">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1 uppercase tracking-wide">
                    Total Production
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {calculateTotalKgs().toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })} Kg
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700 shadow-sm">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1 uppercase tracking-wide">
                    Cost Per Kg
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{calculateOpCostPerKg().toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow hover:shadow-lg transition-all"
              >
                {editingId ? "Update Entry" : "Save Entry"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <LoadingSpinner />
            ) : opCosts.length === 0 ? (
              <EmptyState
                icon={<Calculator size={48} />}
                title="No OP Cost Records"
                description="Start by adding your first monthly operational cost entry."
                action={
                  <button
                    onClick={() => setShowForm(true)}
                    className="prof-btn-primary"
                  >
                    Add First Entry
                  </button>
                }
              />
            ) : (
              <div className="prof-section">
                <DataTable
                  data={opCosts}
                  columns={[
                    {
                      key: "month",
                      label: "Period",
                      render: (_, row) => (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {row.month} {row.year}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(row.createdAt).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                      ),
                    },
                    {
                      key: "costs",
                      label: "Total Cost",
                      render: (costs) => (
                        <span className="font-bold">
                          ₹
                          {(Object.values(costs as any)
                            .reduce((a: any, b: any) => a + b, 0) as number)
                            .toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                        </span>
                      ),
                    },
                    {
                      key: "production",
                      label: "Production",
                      render: (prod) => (
                        <span className="prof-badge-blue">
                          {(
                            (prod as any).mithaiProduction +
                            (prod as any).namkeenProduction
                          ).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          Kg
                        </span>
                      ),
                    },
                    {
                      key: "autoOpCostPerKg",
                      label: "Cost / Kg",
                      render: (val, row) => (
                        <div className="flex flex-col">
                          <span className="font-black text-blue-600 dark:text-blue-400">
                            ₹
                            {val.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          {row.useManualOpCost && (
                            <span className="text-[10px] font-bold text-orange-600 uppercase">
                              Manual Applied
                            </span>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: "_id",
                      label: "Actions",
                      className: "text-right",
                      render: (_, row) => (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(row)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(row._id!)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </ProfessionalPage>
    </Layout>
  );
}
