import { RequestHandler } from "express";
import { getDB } from "../db";
import { ObjectId } from "mongodb";

export const handleGetOpCosts: RequestHandler = async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" });
    }

    const opCosts = await db
      .collection("op_costs")
      .find({})
      .sort({ year: -1, month: -1 })
      .toArray();

    // Ensure all _id fields are strings
    const formattedCosts = opCosts.map(cost => ({
      ...cost,
      _id: cost._id?.toString() || cost._id,
    }));

    res.json({
      success: true,
      data: formattedCosts,
    });
  } catch (error) {
    console.error("Error fetching OP costs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const handleCreateOpCost: RequestHandler = async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" });
    }

    const { month, year, costs, production } = req.body;
    const createdBy = req.body.createdBy || "admin";

    if (!month || !year || !costs || !production) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Calculate auto OP cost per Kg
    const totalCost = (Object.values(costs) as any[]).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    const totalKgs = (Number(production.mithaiProduction) || 0) + (Number(production.namkeenProduction) || 0);
    const autoOpCostPerKg = totalKgs > 0 ? (totalCost as number) / totalKgs : 0;

    const opCostData = {
      month,
      year,
      costs,
      production,
      autoOpCostPerKg,
      manualOpCostPerKg: null,
      useManualOpCost: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      editLog: [],
    };

    const result = await db.collection("op_costs").insertOne(opCostData);

    // Create log entry for creation
    const logEntry = {
      opCostId: result.insertedId.toString(),
      action: "created",
      month,
      year,
      totalCost,
      totalProduction: totalKgs,
      autoOpCostPerKg,
      changedBy: createdBy,
      changeDate: new Date(),
      details: {
        costs,
        production,
      },
    };

    await db.collection("op_cost_logs").insertOne(logEntry);

    res.json({
      success: true,
      message: "OP Cost created successfully",
      data: { ...opCostData, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error("Error creating OP cost:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const handleUpdateOpCost: RequestHandler = async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" });
    }

    const { id } = req.params;
    const { month, year, costs, production } = req.body;
    const editedBy = req.body.editedBy || "admin";

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    // Calculate auto OP cost per Kg
    const totalCost = (Object.values(costs) as any[]).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    const totalKgs = (Number(production.mithaiProduction) || 0) + (Number(production.namkeenProduction) || 0);
    const autoOpCostPerKg = totalKgs > 0 ? (totalCost as number) / totalKgs : 0;

    const objectId = new ObjectId(id);
    const existingDoc = await db.collection("op_costs").findOne({ _id: objectId });

    if (!existingDoc) {
      return res.status(404).json({ success: false, message: "OP Cost not found" });
    }

    // Track changes
    const changes: Record<string, any> = {};
    if (month !== existingDoc.month) changes.month = { from: existingDoc.month, to: month };
    if (year !== existingDoc.year) changes.year = { from: existingDoc.year, to: year };

    const oldTotal = (Object.values(existingDoc.costs || {}) as any[]).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
    const newTotal = totalCost;
    if (Math.abs(oldTotal - newTotal) > 0.01) changes.totalCost = { from: oldTotal, to: newTotal };

    const oldKgs = (Number(existingDoc.production?.mithaiProduction) || 0) + (Number(existingDoc.production?.namkeenProduction) || 0);
    if (Math.abs(oldKgs - totalKgs) > 0.01) changes.totalProduction = { from: oldKgs, to: totalKgs };

    const oldAutoOpCost = existingDoc.autoOpCostPerKg || 0;
    if (Math.abs(oldAutoOpCost - autoOpCostPerKg) > 0.01) {
      changes.autoOpCostPerKg = { from: oldAutoOpCost, to: autoOpCostPerKg };
    }

    const editLogEntry = { timestamp: new Date(), editedBy, changes };

    const updateData = {
      month, year, costs, production, autoOpCostPerKg, updatedAt: new Date(),
    };

    await db.collection("op_costs").updateOne(
      { _id: objectId },
      { $set: updateData, $push: { editLog: editLogEntry } as any }
    );

    // Create log entry in separate collection
    const logEntry = {
      opCostId: id,
      action: "updated",
      month,
      year,
      totalCost: newTotal,
      totalProduction: totalKgs,
      autoOpCostPerKg,
      changedBy: editedBy,
      changeDate: new Date(),
      changes,
      oldValues: {
        month: existingDoc.month,
        year: existingDoc.year,
        totalCost: oldTotal,
        totalProduction: oldKgs,
        autoOpCostPerKg: oldAutoOpCost,
        costs: existingDoc.costs,
        production: existingDoc.production,
      },
      newValues: {
        month,
        year,
        totalCost: newTotal,
        totalProduction: totalKgs,
        autoOpCostPerKg,
        costs,
        production,
      },
    };

    await db.collection("op_cost_logs").insertOne(logEntry);

    // Fetch the updated document
    const updatedDoc = await db.collection("op_costs").findOne({ _id: objectId });

    if (!updatedDoc) {
      return res.status(404).json({ success: false, message: "OP Cost not found after update" });
    }

    // Ensure _id is a string in the response
    const responseData = {
      ...updatedDoc,
      _id: updatedDoc._id?.toString() || updatedDoc._id,
    };

    res.json({
      success: true,
      message: "OP Cost updated successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error updating OP cost:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const handleDeleteOpCost: RequestHandler = async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" });
    }

    const { id } = req.params;
    const deletedBy = req.body.deletedBy || "admin";

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    // Get the document before deleting for logging
    const existingDoc = await db.collection("op_costs").findOne({ _id: new ObjectId(id) });

    if (!existingDoc) {
      return res.status(404).json({ success: false, message: "OP Cost not found" });
    }

    const result = await db.collection("op_costs").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "OP Cost not found" });
    }

    // Create log entry for deletion
    const totalCost = (Object.values(existingDoc.costs || {}) as any[]).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
    const totalKgs = (Number(existingDoc.production?.mithaiProduction) || 0) + (Number(existingDoc.production?.namkeenProduction) || 0);

    const logEntry = {
      opCostId: id,
      action: "deleted",
      month: existingDoc.month,
      year: existingDoc.year,
      totalCost,
      totalProduction: totalKgs,
      autoOpCostPerKg: existingDoc.autoOpCostPerKg,
      changedBy: deletedBy,
      changeDate: new Date(),
      deletedData: {
        costs: existingDoc.costs,
        production: existingDoc.production,
        createdAt: existingDoc.createdAt,
        createdBy: existingDoc.createdBy,
      },
    };

    await db.collection("op_cost_logs").insertOne(logEntry);

    res.json({
      success: true,
      message: "OP Cost deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting OP cost:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const handleBulkUpdateOpCosts: RequestHandler = async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" });
    }

    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: "Invalid updates format" });
    }

    const bulkOps = updates.map(update => {
      const id = typeof update.id === 'string' ? update.id : update.id?.toString();
      return {
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: {
            $set: {
              manualOpCostPerKg: update.manualOpCostPerKg,
              useManualOpCost: update.useManualOpCost,
              updatedAt: new Date(),
            }
          }
        }
      };
    });

    const result = await db.collection("op_costs").bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "OP Costs updated successfully",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error bulk updating OP costs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const handleGetOpCostLogs: RequestHandler = async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not connected" });
    }

    const { opCostId } = req.params;

    const query = opCostId ? { opCostId } : {};

    const logs = await db
      .collection("op_cost_logs")
      .find(query)
      .sort({ changeDate: -1 })
      .toArray();

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching OP cost logs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
