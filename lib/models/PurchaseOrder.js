import mongoose, { Schema } from 'mongoose';

/**
 * Purchase Order Model
 * 
 * Purpose: Store purchase orders for material deliveries
 * Used in SM-03 (Material Receipt & Docket Match) to auto-match delivery dockets
 * 
 * Business Rules:
 * - Each PO has a unique PO number
 * - PO can have multiple line items (materials)
 * - PO status tracks order lifecycle
 * - Matched deliveries reference this PO
 */
const PurchaseOrderSchema = new Schema(
  {
    // Unique PO number (e.g., "PO-2024-001")
    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Site this PO is for
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },

    // Supplier/vendor information
    supplier: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      contact: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
      },
    },

    // PO date
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Expected delivery date
    expectedDeliveryDate: {
      type: Date,
    },

    // Line items (materials ordered)
    lineItems: [
      {
        // Material description (e.g., "Concrete", "Steel beams")
        material: {
          type: String,
          required: true,
          trim: true,
        },
        // Quantity ordered
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        // Unit of measurement (e.g., "kg", "m3", "units")
        unit: {
          type: String,
          trim: true,
        },
        // Unit price
        unitPrice: {
          type: Number,
          min: 0,
        },
        // Total price for this line item
        totalPrice: {
          type: Number,
          min: 0,
        },
      },
    ],

    // Total PO value
    totalAmount: {
      type: Number,
      min: 0,
    },

    // PO status
    status: {
      type: String,
      enum: ['draft', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'],
      default: 'draft',
      required: true,
    },

    // Created by (Contracts Manager or HR)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    // Notes
    notes: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
// Note: poNumber already has unique index from schema definition
PurchaseOrderSchema.index({ siteId: 1, status: 1 });
PurchaseOrderSchema.index({ 'supplier.name': 1 });
PurchaseOrderSchema.index({ orderDate: -1 });

/**
 * Static method: Find matching PO for a delivery
 * Matches based on material description and docket number patterns
 */
PurchaseOrderSchema.statics.findMatchingPO = async function (material, docketNumber, siteId) {
  // First, try to match by material description (case-insensitive)
  const materialMatch = await this.findOne({
    siteId,
    status: { $in: ['approved', 'ordered', 'partially_received'] },
    lineItems: {
      $elemMatch: {
        material: { $regex: new RegExp(material, 'i') },
      },
    },
  }).sort({ orderDate: -1 });

  if (materialMatch) {
    return materialMatch;
  }

  // If no material match, try to extract PO number from docket number
  // Some docket numbers might contain PO reference (e.g., "DOCK-PO-2024-001-12345")
  const poNumberPattern = /PO[-_]?(\d{4}[-_]?\d+)/i;
  const match = docketNumber.match(poNumberPattern);
  if (match) {
    const extractedPONumber = `PO-${match[1].replace(/[-_]/g, '-')}`;
    const poMatch = await this.findOne({
      siteId,
      poNumber: { $regex: new RegExp(extractedPONumber, 'i') },
      status: { $in: ['approved', 'ordered', 'partially_received'] },
    });

    if (poMatch) {
      return poMatch;
    }
  }

  return null;
};

/**
 * Instance method: Mark line item as received
 */
PurchaseOrderSchema.methods.markLineItemReceived = function (material, quantity) {
  const lineItem = this.lineItems.find(
    (item) => item.material.toLowerCase() === material.toLowerCase()
  );

  if (lineItem) {
    lineItem.receivedQuantity = (lineItem.receivedQuantity || 0) + quantity;
    
    // Update PO status based on received quantities
    const allReceived = this.lineItems.every(
      (item) => (item.receivedQuantity || 0) >= item.quantity
    );
    const someReceived = this.lineItems.some(
      (item) => (item.receivedQuantity || 0) > 0
    );

    if (allReceived) {
      this.status = 'received';
    } else if (someReceived) {
      this.status = 'partially_received';
    }
  }

  return this.save();
};

export const PurchaseOrder =
  mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', PurchaseOrderSchema);

