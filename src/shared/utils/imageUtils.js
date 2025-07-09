// ============================================================================
// SIMPLIFIED: imageUtils.js - Image URL Processing for Backend Integration
// ============================================================================

const MOODLE_BASE_URL = import.meta.env.VITE_MOODLE_BASE_URL ;

//  SIMPLIFIED: Image URL resolution per backend requirements
export const resolveImageURL = (src, questionId = null, contextId = '1') => {
  if (!src) {
    console.warn(' Empty image src provided');
    return '';
  }
  
  console.log(` Resolving image URL: ${src}`);
  
  // If already absolute URL, return as is (no token needed per backend)
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    console.log(` Already absolute URL: ${src}`);
    return src;
  }
  
  //  SIMPLIFIED: Direct Moodle URLs - no token needed
  if (src.includes('pluginfile.php')) {
    // If it already has the full path but missing protocol
     if (src.startsWith(MOODLE_BASE_URL.replace(/^https?:\/\//, '') + '/pluginfile.php')) {
      const fullSrc = `http://${src}`;
      console.log(`Fixed local URL: ${fullSrc}`);
      return fullSrc;
    }
    
    // If it's a relative pluginfile URL, make it absolute
    if (src.startsWith('/pluginfile.php')) {
      const fullSrc = `${MOODLE_BASE_URL}${src}`;
      console.log(` Fixed relative pluginfile URL: ${fullSrc}`);
      return fullSrc;
    }
    
    // If it already has protocol, return as is
    console.log(` Moodle pluginfile URL: ${src}`);
    return src;
  }
  
  // Handle @@PLUGINFILE@@ placeholders (if any)
  if (src.includes('@@PLUGINFILE@@')) {
    const cleanSrc = src.replace('@@PLUGINFILE@@/', '');
    const fullSrc = `${MOODLE_BASE_URL}/pluginfile.php/${contextId}/question/questiontext/${questionId}/${cleanSrc}`;
    console.log(` @@PLUGINFILE@@ resolved: ${fullSrc}`);
    return fullSrc;
  }
  
  // Handle other relative URLs
  const cleanSrc = src.startsWith('/') ? src : `/${src}`;
  const fullSrc = `${MOODLE_BASE_URL}${cleanSrc}`;
  
  console.log(` Relative URL resolved: ${fullSrc}`);
  return fullSrc;
};

//  SIMPLIFIED: No token helper (per backend requirements)
export function getMoodleImageUrl(fileurl) {
  if (!fileurl) return '';
  
  console.log(` Processing Moodle image URL: ${fileurl}`);
  
  // If already complete URL, return as is
  if (fileurl.startsWith('http://') || fileurl.startsWith('https://')) {
    console.log(` Complete URL: ${fileurl}`);
    return fileurl;
  }
  
  // Add base URL if relative
  if (!fileurl.startsWith('/')) {
    fileurl = '/' + fileurl;
  }
  
  const finalUrl = `${MOODLE_BASE_URL}${fileurl}`;
  console.log(` Final image URL: ${finalUrl}`);
  return finalUrl;
}

//  SIMPLIFIED: Process HTML content for images
export const processHTMLContent = (htmlContent, questionId = null, contextId = '1') => {
  if (!htmlContent) return '';
  
  console.log(' Processing HTML content for images...');
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Process all images in the content
  const images = tempDiv.querySelectorAll('img');
  console.log(`Found ${images.length} images to process`);
  
  images.forEach((img, index) => {
    const originalSrc = img.getAttribute('src');
    console.log(` Processing image ${index + 1}: ${originalSrc}`);
    
    if (originalSrc) {
      const resolvedSrc = resolveImageURL(originalSrc, questionId, contextId);
      img.setAttribute('src', resolvedSrc);
      console.log(` Updated image src: ${originalSrc} → ${resolvedSrc}`);
      
      // Add error handling
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
    } else {
      console.warn(` Image ${index + 1} has no src attribute`);
    }
  });
  
  // Handle @@PLUGINFILE@@ placeholders in the HTML
  let processedHTML = tempDiv.innerHTML;
  
  // Replace @@PLUGINFILE@@ references
  processedHTML = processedHTML.replace(/@@PLUGINFILE@@\/([^"'\s]+)/g, (match, filename) => {
    const resolvedURL = `${MOODLE_BASE_URL}/pluginfile.php/${contextId}/question/questiontext/${questionId}/${filename}`;
    console.log(` Replaced @@PLUGINFILE@@: ${match} → ${resolvedURL}`);
    return resolvedURL;
  });
  
  // Handle other Moodle file references
  processedHTML = processedHTML.replace(/src=["']([^"']*pluginfile\.php[^"']*)["']/g, (match, url) => {
    if (!url.startsWith('http')) {
      const resolvedURL = url.startsWith('/') ? `${MOODLE_BASE_URL}${url}` : `${MOODLE_BASE_URL}/${url}`;
      console.log(` Fixed pluginfile URL: ${url} → ${resolvedURL}`);
      return `src="${resolvedURL}"`;
    }
    return match;
  });
  
  console.log(' HTML processing complete');
  return processedHTML;
};

//  DEBUGGING: Enhanced debugging for your environment
export const debugImageURL = (url, description = '') => {
  console.group(` Image URL Debug: ${description}`);
  console.log(' Original URL:', url);
  
  const resolved = resolveImageURL(url);
  console.log(' Resolved URL:', resolved);
  
  // Test if URL looks correct
 if (resolved.includes(MOODLE_BASE_URL.replace(/^https?:\/\//, '')) || resolved.includes(MOODLE_BASE_URL)) {
    console.log(' Points to correct Moodle server');
  } else {
    console.log(' May not point to correct server');
  }
  
  // Check if it's a complete URL
  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    console.log(' Complete URL');
  } else {
    console.log(' Incomplete URL');
  }
  
  console.groupEnd();
  
  return resolved;
};