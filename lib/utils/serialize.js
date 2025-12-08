/**
 * Serialize Mongoose objects to plain objects
 * 
 * Converts ObjectIds and other Mongoose-specific types to plain JavaScript types
 * This is needed when passing data from Server Components to Client Components
 */

/**
 * Recursively serialize a Mongoose object to a plain object
 * 
 * @param {any} obj - Object to serialize
 * @returns {any} - Serialized plain object
 */
export function serializeMongoose(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  try {
    // Handle ObjectId
    if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'ObjectId') {
      return obj.toString();
    }

    // Handle Date
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => serializeMongoose(item));
    }

    // Handle plain objects
    if (typeof obj === 'object') {
      // Check if it's a plain object or Mongoose document
      const isPlainObject = obj.constructor === Object || !obj.constructor;
      const isMongooseDoc = obj._id && !isPlainObject;
      
      const serialized = {};
      // Use Object.keys to get all enumerable properties including assignedSites
      const keys = Object.keys(obj);
      for (const key of keys) {
        if (!key.startsWith('$')) {
          try {
            serialized[key] = serializeMongoose(obj[key]);
          } catch (err) {
            // Skip properties that can't be serialized
            console.warn(`Failed to serialize property ${key}:`, err.message);
          }
        }
      }
      return serialized;
    }

    // Handle primitives
    return obj;
  } catch (error) {
    console.error('Error in serializeMongoose:', error);
    // Return a safe fallback
    return obj?.toString() || String(obj);
  }
}

/**
 * Serialize multiple objects
 * 
 * @param {any[]} objects - Array of objects to serialize
 * @returns {any[]} - Array of serialized objects
 */
export function serializeMongooseArray(objects) {
  return objects.map(obj => serializeMongoose(obj));
}

