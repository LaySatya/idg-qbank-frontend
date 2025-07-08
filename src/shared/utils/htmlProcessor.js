
// ============================================================================
// utils/htmlProcessor.js - HTML Content Processing Utilities
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Enhanced image URL resolution with better Moodle support
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
  
  // Handle Moodle pluginfile URLs
  if (src.includes('pluginfile.php') || src.includes('webservice/pluginfile.php')) {
    // If it's already a relative pluginfile URL, make it absolute
    const baseURL = API_BASE_URL.replace('/api', '');
    const fullSrc = src.startsWith('/') ? `${baseURL}${src}` : `${baseURL}/${src}`;
    console.log(` Moodle pluginfile URL resolved: ${fullSrc}`);
    return fullSrc;
  }
  
  // Handle @@PLUGINFILE@@ placeholders - FIXED with proper context
  if (src.includes('@@PLUGINFILE@@')) {
    const baseURL = API_BASE_URL.replace('/api', '');
    const cleanSrc = src.replace('@@PLUGINFILE@@/', '');
    
    // Use proper Moodle pluginfile URL structure with extracted context
    const fullSrc = `${baseURL}/pluginfile.php/${contextId}/question/questiontext/${questionId}/${cleanSrc}`;
    console.log(` @@PLUGINFILE@@ resolved with context ${contextId}: ${fullSrc}`);
    return fullSrc;
  }
  
  // Handle relative URLs
  const baseURL = API_BASE_URL.replace('/api', '');
  const cleanSrc = src.startsWith('/') ? src : `/${src}`;
  const fullSrc = `${baseURL}${cleanSrc}`;
  
  console.log(` Relative URL resolved: ${fullSrc}`);
  return fullSrc;
};

// Process HTML content for images with enhanced image handling
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
    console.log(`Processing image ${index + 1}: ${originalSrc}`);
    
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
  
  // Replace @@PLUGINFILE@@ references with proper context
  processedHTML = processedHTML.replace(/@@PLUGINFILE@@\/([^"'\s]+)/g, (match, filename) => {
    const baseURL = API_BASE_URL.replace('/api', '');
    const resolvedURL = `${baseURL}/pluginfile.php/${contextId}/question/questiontext/${questionId}/${filename}`;
    console.log(` Replaced @@PLUGINFILE@@ with context: ${match} → ${resolvedURL}`);
    return resolvedURL;
  });
  
  // Handle other Moodle file references
  processedHTML = processedHTML.replace(/src=["']([^"']*webservice\/pluginfile\.php[^"']*)["']/g, (match, url) => {
    if (!url.startsWith('http')) {
      const baseURL = API_BASE_URL.replace('/api', '');
      const resolvedURL = url.startsWith('/') ? `${baseURL}${url}` : `${baseURL}/${url}`;
      console.log(` Fixed pluginfile URL: ${url} → ${resolvedURL}`);
      return `src="${resolvedURL}"`;
    }
    return match;
  });
  
  // Handle encoded URLs (like %20 for spaces)
  processedHTML = processedHTML.replace(/@@PLUGINFILE@@\/([^"'\s]*)/g, (match, filename) => {
    const baseURL = API_BASE_URL.replace('/api', '');
    const decodedFilename = decodeURIComponent(filename);
    const resolvedURL = `${baseURL}/pluginfile.php/${contextId}/question/questiontext/${questionId}/${decodedFilename}`;
    console.log(` Replaced encoded @@PLUGINFILE@@: ${match} → ${resolvedURL}`);
    return resolvedURL;
  });
  
  console.log('HTML processing complete');
  return processedHTML;
};

// Extract images from HTML content with enhanced detection
export const extractImagesFromHTML = (htmlContent, questionId = null, contextId = '1') => {
  if (!htmlContent) return [];
  
  const images = [];
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Look for all img elements
  const imgElements = tempDiv.querySelectorAll('img');
  console.log(` Found ${imgElements.length} img elements in HTML`);
  
  imgElements.forEach((img, index) => {
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt') || `Image ${index + 1}`;
    const width = img.getAttribute('width');
    const height = img.getAttribute('height');
    
    console.log(` Processing image ${index + 1}:`, { src, alt, width, height });
    
    if (src) {
      const resolvedSrc = resolveImageURL(src, questionId, contextId);
      images.push({
        src: resolvedSrc,
        originalSrc: src,
        alt,
        width,
        height,
        style: img.getAttribute('style') || ''
      });
      console.log(` Added image: ${resolvedSrc}`);
    } else {
      console.warn(` Image ${index + 1} has no src attribute`);
    }
  });
  
  // Also look for background images in style attributes
  const elementsWithBackgrounds = tempDiv.querySelectorAll('[style*="background-image"]');
  elementsWithBackgrounds.forEach((element, index) => {
    const style = element.getAttribute('style');
    const bgImageMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
    if (bgImageMatch) {
      const src = bgImageMatch[1];
      const resolvedSrc = resolveImageURL(src, questionId, contextId);
      images.push({
        src: resolvedSrc,
        originalSrc: src,
        alt: `Background Image ${index + 1}`,
        isBackground: true
      });
      console.log(` Added background image: ${resolvedSrc}`);
    }
  });
  
  // Look for common Moodle image patterns in the HTML
  const moodleImagePatterns = [
    /@@PLUGINFILE@@\/([^"'\s]+)/g,
    /webservice\/pluginfile\.php\/[^"'\s]+/g,
    /draftfile\.php\/[^"'\s]+/g
  ];
  
  moodleImagePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(htmlContent)) !== null) {
      const src = match[0].replace('@@PLUGINFILE@@/', '');
      const resolvedSrc = resolveImageURL(src, questionId, contextId);
      images.push({
        src: resolvedSrc,
        originalSrc: match[0],
        alt: 'Moodle File',
        isMoodleFile: true
      });
      console.log(`Added Moodle file: ${resolvedSrc}`);
    }
  });
  
  console.log(` Total images found: ${images.length}`);
  return images;
};

// Clean HTML content for display (remove scripts, fix formatting)
export const cleanHTMLContent = (htmlContent) => {
  if (!htmlContent) return '';
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Remove script tags
  const scripts = tempDiv.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove dangerous attributes
  const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover'];
  const allElements = tempDiv.querySelectorAll('*');
  
  allElements.forEach(element => {
    dangerousAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    });
  });
  
  return tempDiv.innerHTML;
};

// Format text content (strip HTML tags but preserve structure)
export const formatTextContent = (htmlContent) => {
  if (!htmlContent) return '';
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Replace common HTML elements with text equivalents
  const brs = tempDiv.querySelectorAll('br');
  brs.forEach(br => br.replaceWith('\n'));
  
  const ps = tempDiv.querySelectorAll('p');
  ps.forEach(p => {
    p.insertAdjacentText('afterend', '\n\n');
  });
  
  const headers = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headers.forEach(header => {
    header.insertAdjacentText('afterend', '\n\n');
  });
  
  return tempDiv.textContent || tempDiv.innerText || '';
};

// Validate HTML content
export const validateHTMLContent = (htmlContent) => {
  if (!htmlContent) return { isValid: true, errors: [] };
  
  const errors = [];
  const tempDiv = document.createElement('div');
  
  try {
    tempDiv.innerHTML = htmlContent;
    
    // Check for unclosed tags
    if (htmlContent.includes('<') && !htmlContent.includes('>')) {
      errors.push('Unclosed HTML tags detected');
    }
    
    // Check for malformed attributes
    if (htmlContent.match(/=["'][^"']*$/)) {
      errors.push('Malformed HTML attributes detected');
    }
    
    // Check for suspicious content
    if (htmlContent.toLowerCase().includes('javascript:')) {
      errors.push('Potentially unsafe JavaScript detected');
    }
    
  } catch (err) {
    errors.push(`HTML parsing error: ${err.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Debug HTML processing
export const debugHTMLProcessing = (htmlContent, questionId, contextId) => {
  console.group(' HTML Processing Debug');
  console.log(' Input HTML:', htmlContent);
  console.log(' Question ID:', questionId);
  console.log(' Context ID:', contextId);
  
  const images = extractImagesFromHTML(htmlContent, questionId, contextId);
  console.log(' Extracted Images:', images);
  
  const processedHTML = processHTMLContent(htmlContent, questionId, contextId);
  console.log(' Processed HTML:', processedHTML);
  
  const validation = validateHTMLContent(processedHTML);
  console.log(' Validation Result:', validation);
  
  console.groupEnd();
  
  return {
    original: htmlContent,
    processed: processedHTML,
    images,
    validation
  };
};