// Utility script to test Gemini model availability
// Run this in browser console or create a test page component

import { listAvailableModels, refreshModelCache, getModelCacheStatus } from '../services/geminiService';

export async function runModelTest() {
  console.log('🚀 Starting Gemini Model Availability Test...\n');
  
  try {
    // Test 1: Check current cache status
    console.log('📋 Current Cache Status:');
    const cacheStatus = getModelCacheStatus();
    console.log(cacheStatus ? '✅ Cache exists' : '❌ No cache found');
    if (cacheStatus) {
      console.log('Cached models:', cacheStatus.available);
      console.log('Best available:', cacheStatus.bestAvailable);
    }
    console.log('');
    
    // Test 2: Refresh and list all available models
    console.log('🔍 Testing Model Availability:');
    const modelInfo = await listAvailableModels();
    
    console.log('\n📊 FINAL RESULTS:');
    console.log('==================');
    console.log(`✅ Available Models (${modelInfo.available.length}):`);
    modelInfo.available.forEach(model => console.log(`  • ${model}`));
    
    console.log(`\n❌ Unavailable Models (${modelInfo.unavailable.length}):`);
    modelInfo.unavailable.forEach(model => console.log(`  • ${model.name}`));
    
    console.log(`\n🎯 Recommended Model: ${modelInfo.bestAvailable || 'None available'}`);
    
    if (modelInfo.error) {
      console.log(`\n💥 Error: ${modelInfo.error}`);
    }
    
    // Test 3: Try to refresh cache
    console.log('\n🔄 Testing Cache Refresh:');
    const refreshedCache = await refreshModelCache();
    console.log('Refreshed cache:', refreshedCache);
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Export for use in components
export default runModelTest;