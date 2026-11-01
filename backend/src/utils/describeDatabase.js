/**
 * Where a database URL points, safe to print in logs: host, port and database name only.
 * The user name and password are never included.
 * @param {string} url a postgresql:// connection URL
 */
export function describeDatabase(url) {
  try {
    const { hostname, port, pathname } = new URL(url);
    return `${hostname}:${port || '5432'}${pathname}`;
  } catch {
    return 'an unreadable DATABASE_URL';
  }
}
