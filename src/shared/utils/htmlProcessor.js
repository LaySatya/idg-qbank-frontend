// ============================================================================
// FIXED: htmlProcessor.js - Image URL Processing for Local Environment
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MOODLE_BASE_URL = import.meta.env.VITE_MOODLE_BASE_URL ;
//  FIXED: Enhanced image URL resolution for your local environment
export const resolveImageURL = (src, questionId = null, contextId = '1') => {
  if (!src) {
    console.warn(' Empty image src provided');
    return '';
  }
  
  console.log(` Resolving image URL: ${src}`);
  
  // If already absolute URL, return as is
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    console.log(` Already absolute URL: ${src}`);
    return src;
  }
  
  // CRITICAL FIX: Handle your local Moodle server URLs
  if (src.includes('pluginfile.php') || src.includes('webservice/pluginfile.php')) {
    // Your URLs are like: http://10.5.5.205/pluginfile.php/59/qtype_ddimageortext/dragimage/544/1/367/shading.png
    
    // If it's already a complete local URL but missing protocol
       if (src.startsWith(MOODLE_BASE_URL + '/pluginfile.php')) {
      const fullSrc = `http://${src}`;
      console.log(` Fixed local URL: ${fullSrc}`);
      return fullSrc;
    }
    
    // If it's a relative pluginfile URL, make it absolute
    if (src.startsWith('/pluginfile.php')) {
      const fullSrc = `${MOODLE_BASE_URL}${src}`;

      console.log(` Fixed relative pluginfile URL: ${fullSrc}`);
      return fullSrc;
    }
    
    // If it already has protocol, return as is
    console.log(`Moodle pluginfile URL: ${src}`);
    return src;
  }
  
  // Handle @@PLUGINFILE@@ placeholders
  if (src.includes('@@PLUGINFILE@@')) {
    const cleanSrc = src.replace('@@PLUGINFILE@@/', '');
    // Use your local Moodle server
    const fullSrc = `${MOODLE_BASE_URL}/pluginfile.php/${contextId}/question/questiontext/${questionId}/${cleanSrc}`;

    console.log(` @@PLUGINFILE@@ resolved: ${fullSrc}`);
    return fullSrc;
  }
  
  // Handle relative URLs - point to your local server
  const cleanSrc = src.startsWith('/') ? src : `/${src}`;
  const fullSrc = `${MOODLE_BASE_URL}${cleanSrc}`;
  
  console.log(` Relative URL resolved: ${fullSrc}`);
  return fullSrc;
};

//  FIXED: Process HTML content for images with your local server
export const processHTMLContent = (htmlContent, questionId = null, contextId = '1') => {
  if (!htmlContent) return '';
  
  console.log(' Processing HTML content for images...');
  console.log(` Original HTML (first 200 chars): ${htmlContent.substring(0, 200)}...`);
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Process all images in the content
  const images = tempDiv.querySelectorAll('img');
  console.log(` Found ${images.length} images to process`);
  
  images.forEach((img, index) => {
    const originalSrc = img.getAttribute('src');
    console.log(` Processing image ${index + 1}: ${originalSrc}`);
    
    if (originalSrc) {
      const resolvedSrc = resolveImageURL(originalSrc, questionId, contextId);
      img.setAttribute('src', resolvedSrc);
      console.log(` Updated image src: ${originalSrc} → ${resolvedSrc}`);
      
      // Add error handling attributes
      img.setAttribute('onerror', `
        console.error(' Failed to load image: ${resolvedSrc}'); 
        this.style.border='2px solid red'; 
        this.alt=' Image failed to load: ${originalSrc}';
        this.style.padding='10px';
        this.style.backgroundColor='#fff5f5';
        this.style.color='#721c24';
        this.style.fontSize='12px';
        this.style.textAlign='center';
        this.style.display='block';
        this.style.minHeight='50px';
      `);
      
      // Add responsive styling
      if (!img.style.maxWidth) {
        img.style.maxWidth = '100%';
      }
      img.style.height = 'auto';
      img.style.borderRadius = '4px';
      img.style.display = 'block';
      img.style.margin = '10px auto';
      
      // Add title for debugging
      img.setAttribute('title', `Original: ${originalSrc}\nResolved: ${resolvedSrc}`);
      
      // Add loading state
      img.style.backgroundColor = '#f8f9fa';
      img.style.minHeight = '50px';
    } else {
      console.warn(` Image ${index + 1} has no src attribute`);
    }
  });
  
  // Handle @@PLUGINFILE@@ placeholders in the HTML
  let processedHTML = tempDiv.innerHTML;
  
  //  FIXED: Replace @@PLUGINFILE@@ references with your local server
  processedHTML = processedHTML.replace(/@@PLUGINFILE@@\/([^"'\s]+)/g, (match, filename) => {
    const resolvedURL = `${MOODLE_BASE_URL}/pluginfile.php/${contextId}/question/questiontext/${questionId}/${filename}`;

    console.log(` Replaced @@PLUGINFILE@@: ${match} → ${resolvedURL}`);
    return resolvedURL;
  });
  
  // Handle other Moodle file references for your local server
  processedHTML = processedHTML.replace(/src=["']([^"']*pluginfile\.php[^"']*)["']/g, (match, url) => {
    if (!url.startsWith('http')) {
      const resolvedURL = url.startsWith('/') ? `${MOODLE_BASE_URL}${url}` : `${MOODLE_BASE_URL}/${url}`;

      console.log(`Fixed pluginfile URL: ${url} → ${resolvedURL}`);
      return `src="${resolvedURL}"`;
    }
    return match;
  });
  
  console.log(' HTML processing complete');
  return processedHTML;
};

//  FIXED: Enhanced debugging for your environment
export const debugHTMLProcessing = (htmlContent, questionId, contextId) => {
  console.group(' HTML Processing Debug');
  console.log('Input HTML:', htmlContent);
  console.log('Question ID:', questionId);
  console.log(' Context ID:', contextId);
  console.log(' API Base URL:', API_BASE_URL);
 console.log('Local Server Expected:', MOODLE_BASE_URL);

  
  const processedHTML = processHTMLContent(htmlContent, questionId, contextId);
  console.log(' Processed HTML:', processedHTML);
  
  // Test image URLs
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = processedHTML;
  const images = tempDiv.querySelectorAll('img');
  
  console.log(` Image URLs after processing (${images.length} images):`);
  images.forEach((img, index) => {
    const src = img.getAttribute('src');
    console.log(`  ${index + 1}. ${src}`);
    
    // Test if URL is reachable (in a real environment)
        if (src.startsWith(MOODLE_BASE_URL.replace(/^https?:\/\//, '') + '/pluginfile.php')) {
      console.log(`     Points to local server`);
    } else {
      console.log(`     May not be accessible`);
    }
  });
  
  console.groupEnd();
  
  return {
    original: htmlContent,
    processed: processedHTML,
    imageCount: images.length,
    localServerUsed: processedHTML.includes(MOODLE_BASE_URL.replace(/^https?:\/\//, ''))
  };
};