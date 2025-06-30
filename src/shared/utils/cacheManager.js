// // ============================================================================
// // src/utils/cacheManager.js - ADVANCED CACHE MANAGEMENT
// // High-Performance Caching System for Large Moodle Datasets
// // ============================================================================

// /**
//  * Advanced cache manager with LRU eviction, TTL, and memory optimization
//  * Designed for high-performance caching of Moodle API responses
//  */
// class AdvancedCacheManager {
//   constructor(options = {}) {
//     this.maxSize = options.maxSize || 100; // Maximum number of cache entries
//     this.defaultTTL = options.defaultTTL || 10 * 60 * 1000; // 10 minutes default TTL
//     this.checkInterval = options.checkInterval || 60 * 1000; // Check expired items every minute
    
//     // Cache storage
//     this.cache = new Map();
//     this.accessTimes = new Map();
//     this.expirationTimes = new Map();
    
//     // Statistics
//     this.stats = {
//       hits: 0,
//       misses: 0,
//       evictions: 0,
//       expired: 0,
//       sets: 0
//     };
    
//     // Start cleanup interval
//     this.startCleanupInterval();
    
//     console.log('🚀 AdvancedCacheManager initialized:', options);
//   }

//   /**
//    * Generate cache key from multiple parameters
//    */
//   generateKey(...parts) {
//     return parts
//       .filter(part => part !== null && part !== undefined)
//       .map(part => typeof part === 'object' ? JSON.stringify(part) : String(part))
//       .join(':');
//   }

//   /**
//    * Set cache entry with TTL
//    */
//   set(key, value, ttl = this.defaultTTL) {
//     const now = Date.now();
    
//     // Remove old entry if exists
//     if (this.cache.has(key)) {
//       this.accessTimes.delete(key);
//       this.expirationTimes.delete(key);
//     }
    
//     // Check if we need to evict entries
//     if (this.cache.size >= this.maxSize) {
//       this.evictLRU();
//     }
    
//     // Set new entry
//     this.cache.set(key, value);
//     this.accessTimes.set(key, now);
//     this.expirationTimes.set(key, now + ttl);
    
//     this.stats.sets++;
    
//     console.log(`📦 Cache SET: ${key} (TTL: ${ttl}ms, Size: ${this.cache.size})`);
//   }

//   /**
//    * Get cache entry
//    */
//   get(key) {
//     const now = Date.now();
    
//     // Check if key exists
//     if (!this.cache.has(key)) {
//       this.stats.misses++;
//       return null;
//     }
    
//     // Check if expired
//     const expirationTime = this.expirationTimes.get(key);
//     if (now > expirationTime) {
//       this.delete(key);
//       this.stats.expired++;
//       this.stats.misses++;
//       console.log(`⏰ Cache EXPIRED: ${key}`);
//       return null;
//     }
    
//     // Update access time
//     this.accessTimes.set(key, now);
//     this.stats.hits++;
    
//     const value = this.cache.get(key);
//     console.log(`📦 Cache HIT: ${key}`);
//     return value;
//   }

//   /**
//    * Check if key exists and is not expired
//    */
//   has(key) {
//     const now = Date.now();
    
//     if (!this.cache.has(key)) {
//       return false;
//     }
    
//     const expirationTime = this.expirationTimes.get(key);
//     if (now > expirationTime) {
//       this.delete(key);
//       return false;
//     }
    
//     return true;
//   }

//   /**
//    * Delete cache entry
//    */
//   delete(key) {
//     const deleted = this.cache.delete(key);
//     this.accessTimes.delete(key);
//     this.expirationTimes.delete(key);
    
//     if (deleted) {
//       console.log(`🗑️ Cache DELETE: ${key}`);
//     }
    
//     return deleted;
//   }

//   /**
//    * Clear all cache entries
//    */
//   clear() {
//     const size = this.cache.size;
//     this.cache.clear();
//     this.accessTimes.clear();
//     this.expirationTimes.clear();
    
//     console.log(`🧹 Cache CLEAR: ${size} entries removed`);
//   }

//   /**
//    * Clear cache entries matching pattern
//    */
//   clearPattern(pattern) {
//     let cleared = 0;
    
//     for (const key of this.cache.keys()) {
//       if (key.includes(pattern)) {
//         this.delete(key);
//         cleared++;
//       }
//     }
    
//     console.log(`🧹 Cache CLEAR PATTERN "${pattern}": ${cleared} entries removed`);
//     return cleared;
//   }

//   /**
//    * Evict least recently used entry
//    */
//   evictLRU() {
//     let oldestKey = null;
//     let oldestTime = Infinity;
    
//     for (const [key, time] of this.accessTimes.entries()) {
//       if (time < oldestTime) {
//         oldestTime = time;
//         oldestKey = key;
//       }
//     }
    
//     if (oldestKey) {
//       this.delete(oldestKey);
//       this.stats.evictions++;
//       console.log(`🔄 Cache LRU EVICT: ${oldestKey}`);
//     }
//   }

//   /**
//    * Clean up expired entries
//    */
//   cleanupExpired() {
//     const now = Date.now();
//     let cleaned = 0;
    
//     for (const [key, expirationTime] of this.expirationTimes.entries()) {
//       if (now > expirationTime) {
//         this.delete(key);
//         cleaned++;
//         this.stats.expired++;
//       }
//     }
    
//     if (cleaned > 0) {
//       console.log(`🧹 Cache CLEANUP: ${cleaned} expired entries removed`);
//     }
    
//     return cleaned;
//   }

//   /**
//    * Start cleanup interval
//    */
//   startCleanupInterval() {
//     this.cleanupIntervalId = setInterval(() => {
//       this.cleanupExpired();
//     }, this.checkInterval);
//   }

//   /**
//    * Stop cleanup interval
//    */
//   stopCleanupInterval() {
//     if (this.cleanupIntervalId) {
//       clearInterval(this.cleanupIntervalId);
//       this.cleanupIntervalId = null;
//     }
//   }

//   /**
//    * Get cache statistics
//    */
//   getStats() {
//     const totalRequests = this.stats.hits + this.stats.misses;
//     const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
//     return {
//       ...this.stats,
//       totalRequests,
//       hitRate: Math.round(hitRate * 100) / 100,
//       size: this.cache.size,
//       maxSize: this.maxSize,
//       memoryUsage: this.getMemoryUsage()
//     };
//   }

//   /**
//    * Get memory usage estimation
//    */
//   getMemoryUsage() {
//     let totalSize = 0;
    
//     for (const [key, value] of this.cache.entries()) {
//       totalSize += key.length * 2; // Approximate string size
//       totalSize += JSON.stringify(value).length * 2; // Approximate object size
//     }
    
//     return {
//       bytes: totalSize,
//       kb: Math.round(totalSize / 1024 * 100) / 100,
//       mb: Math.round(totalSize / (1024 * 1024) * 100) / 100
//     };
//   }

//   /**
//    * Get cache entries for debugging
//    */
//   getEntries() {
//     const entries = [];
//     const now = Date.now();
    
//     for (const [key, value] of this.cache.entries()) {
//       const accessTime = this.accessTimes.get(key);
//       const expirationTime = this.expirationTimes.get(key);
//       const ttl = expirationTime - now;
      
//       entries.push({
//         key,
//         accessTime: new Date(accessTime).toISOString(),
//         expirationTime: new Date(expirationTime).toISOString(),
//         ttlRemaining: Math.max(0, ttl),
//         isExpired: ttl <= 0,
//         valueSize: JSON.stringify(value).length
//       });
//     }
    
//     return entries.sort((a, b) => b.accessTime - a.accessTime);
//   }

//   /**
//    * Destroy cache manager
//    */
//   destroy() {
//     this.stopCleanupInterval();
//     this.clear();
//     console.log('💥 AdvancedCacheManager destroyed');
//   }
// }

// // Create singleton instance
// const cacheManager = new AdvancedCacheManager({
//   maxSize: 200,
//   defaultTTL: 10 * 60 * 1000, // 10 minutes
//   checkInterval: 2 * 60 * 1000 // Check every 2 minutes
// });

// // Cache utilities for specific use cases
// export const questionCategoriesCache = {
//   get: (courseId) => cacheManager.get(`question_categories:${courseId}`),
//   set: (courseId, data, ttl) => cacheManager.set(`question_categories:${courseId}`, data, ttl),
//   clear: (courseId) => {
//     if (courseId) {
//       cacheManager.delete(`question_categories:${courseId}`);
//     } else {
//       cacheManager.clearPattern('question_categories:');
//     }
//   }
// };

// export const questionsCache = {
//   get: (filters, page, perPage) => {
//     const key = cacheManager.generateKey('questions', filters, page, perPage);
//     return cacheManager.get(key);
//   },
//   set: (filters, page, perPage, data, ttl) => {
//     const key = cacheManager.generateKey('questions', filters, page, perPage);
//     cacheManager.set(key, data, ttl);
//   },
//   clear: (courseId) => {
//     if (courseId) {
//       cacheManager.clearPattern(`questions:*:courseId:${courseId}`);
//     } else {
//       cacheManager.clearPattern('questions:');
//     }
//   }
// };

// export const coursesCache = {
//   get: (categoryId) => cacheManager.get(`courses:${categoryId}`),
//   set: (categoryId, data, ttl) => cacheManager.set(`courses:${categoryId}`, data, ttl),
//   clear: (categoryId) => {
//     if (categoryId) {
//       cacheManager.delete(`courses:${categoryId}`);
//     } else {
//       cacheManager.clearPattern('courses:');
//     }
//   }
// };

// // Export the main cache manager and utilities
// export { cacheManager };
// export default cacheManager;