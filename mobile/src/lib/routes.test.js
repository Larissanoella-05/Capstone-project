import fs from 'node:fs';
import path from 'node:path';
import { routeForNotification } from './routes.js';

describe('routeForNotification', () => {
  it('opens the fault for a customer and the job for a technician', () => {
    expect(routeForNotification('CUSTOMER', { faultId: '7' })).toBe('/customer/faults/7');
    expect(routeForNotification('TECHNICIAN', { faultId: 7 })).toBe('/technician/jobs/7');
  });

  it('falls back to the alerts tab when there is no usable fault id', () => {
    expect(routeForNotification('CUSTOMER', {})).toBe('/customer/notifications');
    expect(routeForNotification('TECHNICIAN', { faultId: 'abc' })).toBe(
      '/technician/notifications'
    );
    expect(routeForNotification('TECHNICIAN', { faultId: 0 })).toBe('/technician/notifications');
  });

  it('has no route for a coordinator', () => {
    expect(routeForNotification('COORDINATOR', { faultId: 7 })).toBeNull();
  });
});

describe('navigation structure', () => {
  const appDir = path.join(__dirname, '..', '..', 'app');
  const layouts = ['customer', 'technician'].flatMap((role) => [
    path.join(appDir, role, '_layout.js'),
    path.join(appDir, role, '(tabs)', '_layout.js'),
  ]);

  // expo-router 58 turns `href: null` into a hidden tab, and a hidden tab that gets focus is redirected
  // to the first tab. A detail screen hidden that way bounces straight back to Home (Track live, Open job).
  it('never hides a screen in a tab bar with href: null', () => {
    for (const layout of layouts) {
      expect(fs.readFileSync(layout, 'utf8')).not.toMatch(/href:\s*null/);
    }
  });

  it('keeps the detail screens outside the tabs, in the role stack', () => {
    for (const role of ['customer', 'technician']) {
      const tabs = fs.readdirSync(path.join(appDir, role, '(tabs)'));
      expect(tabs.filter((name) => name.includes('['))).toEqual([]);
    }
  });
});
