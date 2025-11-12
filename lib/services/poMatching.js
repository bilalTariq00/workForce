import { PurchaseOrder } from '@/lib/models/PurchaseOrder';

/**
 * PO Matching Service
 * 
 * Purpose: Auto-match delivery dockets to Purchase Orders
 * Used in SM-03 (Material Receipt & Docket Match)
 */

/**
 * Match a delivery to a Purchase Order
 * 
 * @param {Object} delivery - Delivery object with material, docketNumber
 * @param {string} siteId - Site ID
 * @returns {Object} - { matched: boolean, poId: string|null, poNumber: string|null }
 */
export async function matchDeliveryToPO(delivery, siteId) {
  try {
    if (!delivery.material || !delivery.docketNumber) {
      return {
        matched: false,
        poId: null,
        poNumber: null,
        matchMethod: null,
      };
    }

    // Use the static method from PurchaseOrder model
    const matchedPO = await PurchaseOrder.findMatchingPO(
      delivery.material,
      delivery.docketNumber,
      siteId
    );

    if (matchedPO) {
      return {
        matched: true,
        poId: matchedPO._id.toString(),
        poNumber: matchedPO.poNumber,
        matchMethod: 'auto',
      };
    }

    return {
      matched: false,
      poId: null,
      poNumber: null,
      matchMethod: null,
    };
  } catch (error) {
    console.error('Error matching delivery to PO:', error);
    return {
      matched: false,
      poId: null,
      poNumber: null,
      matchMethod: null,
      error: error.message,
    };
  }
}

/**
 * Match all deliveries in a daily log
 * 
 * @param {Array} deliveries - Array of delivery objects
 * @param {string} siteId - Site ID
 * @returns {Array} - Updated deliveries with PO match status
 */
export async function matchAllDeliveries(deliveries, siteId) {
  if (!deliveries || deliveries.length === 0) {
    return [];
  }

  const matchedDeliveries = await Promise.all(
    deliveries.map(async (delivery) => {
      // If already matched manually, keep it
      if (delivery.poMatchStatus === 'matched' && delivery.poId) {
        return delivery;
      }

      // Try to auto-match
      const matchResult = await matchDeliveryToPO(delivery, siteId);

      if (matchResult.matched) {
        return {
          ...delivery,
          poMatchStatus: 'matched',
          poId: matchResult.poId,
        };
      }

      // If no match found, mark as unmatched
      return {
        ...delivery,
        poMatchStatus: 'unmatched',
        poId: null,
      };
    })
  );

  return matchedDeliveries;
}

