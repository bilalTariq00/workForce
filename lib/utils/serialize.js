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

  // Handle ObjectId
  if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'ObjectId') {
    return obj.toString();
  }

  // Handle Mongoose documents (even if they look like plain objects)
  if (obj && typeof obj === 'object' && obj._id && obj.constructor && obj.constructor.name !== 'Object') {
    // Convert Mongoose document to plain object
    const plain = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !key.startsWith('$')) {
        plain[key] = serializeMongoose(obj[key]);
      }
    }
    return plain;
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
  if (typeof obj === 'object' && obj.constructor === Object) {
    const serialized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !key.startsWith('$')) {
        serialized[key] = serializeMongoose(obj[key]);
      }
    }
    return serialized;
  }

  // Handle primitives
  return obj;
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

