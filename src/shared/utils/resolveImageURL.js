const MOODLE_BASE_URL = import.meta.env.VITE_MOODLE_BASE_URL;

export const resolveImageURL = (src) => {
  if (!src) return '';

  // Replace any hardcoded Moodle base URL (with or without protocol) with your environment host
  const srcNoProtocol = src.replace(/^https?:\/\//, '');
  const baseNoProtocol = MOODLE_BASE_URL.replace(/^https?:\/\//, '');

  if (srcNoProtocol.startsWith(baseNoProtocol)) {
    return src.replace(/^https?:\/\//, MOODLE_BASE_URL + '/');
  }

  // Support relative pluginfile.php paths
  if (src.startsWith('/pluginfile.php')) {
    return `${MOODLE_BASE_URL}${src}`;
  }

  // Default - return as-is
  return src;
};