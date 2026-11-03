// Unit tests for the landing page copy and link data. Run with: npm test
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as content from './landingContent.js';

/** Every string in the content, with the path it was found at. */
function strings(value, path = 'content', found = []) {
  if (typeof value === 'string') found.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, found));
  else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) strings(v, `${path}.${key}`, found);
  }
  return found;
}

/** Every `link` object (router link to sign-in) in the content. */
function links(value, found = []) {
  if (Array.isArray(value)) value.forEach((v) => links(v, found));
  else if (value && typeof value === 'object') {
    if (value.link) found.push(value.link);
    for (const [key, v] of Object.entries(value)) if (key !== 'link') links(v, found);
  }
  return found;
}

const ALL = strings({ ...content });

describe('landing content copy', () => {
  it('has no [placeholder] text', () => {
    for (const [path, text] of ALL) assert.ok(!/\[[^\]]*\]/.test(text), `${path}: ${text}`);
  });

  it('never mentions Ndera', () => {
    for (const [path, text] of ALL) assert.ok(!/ndera/i.test(text), path);
  });

  it('has eight FAQ entries with non-empty answers that do not promise SMS', () => {
    assert.equal(content.FAQ.items.length, 8);
    for (const { q, a } of content.FAQ.items) {
      assert.ok(q.trim() && a.trim());
      assert.ok(!/text you|sms/i.test(a), q);
    }
  });

  it('has three safety tips without dates, authors or Learn more', () => {
    assert.equal(content.SAFETY_TIPS.items.length, 3);
    for (const tip of content.SAFETY_TIPS.items) {
      for (const key of ['date', 'by', 'author', 'link']) assert.ok(!(key in tip), key);
    }
    for (const [path, text] of strings(content.SAFETY_TIPS)) {
      assert.ok(!/learn more|author/i.test(text), path);
    }
  });
});

describe('landing content links', () => {
  it('sends every router link to /login with a from target', () => {
    const found = links({ ...content });
    assert.ok(found.length >= 10);
    for (const link of found) {
      assert.equal(link.to, '/login');
      assert.match(link.state.from, /^\/(customer|coordinator|technician)/);
    }
  });

  it('uses the customer report as the target for Report and the service cards', () => {
    assert.equal(content.REPORT_LINK.state.from, '/customer/report');
    for (const item of content.SERVICES.items)
      assert.equal(item.link.state.from, '/customer/report');
  });

  it('gives coordinators and technicians their own home', () => {
    assert.equal(content.COORDINATOR_LINK.state.from, '/coordinator');
    const targets = content.ROLES.items.map((item) => item.link.state.from);
    assert.deepEqual(targets, ['/customer/report', '/coordinator', '/technician']);
  });

  it('only uses https for external URLs', () => {
    for (const [path, text] of ALL) {
      if (/^[a-z]+:\/\//i.test(text)) assert.ok(text.startsWith('https://'), path);
    }
    for (const social of content.FOOTER.socials) assert.ok(social.href.startsWith('https://'));
  });
});

describe('landing footer', () => {
  it('lists the REG contact details', () => {
    assert.equal(content.FOOTER.contactTitle, 'Electricity provider (REG)');
    const text = content.FOOTER.contact.map((c) => c.label).join(' | ');
    assert.ok(text.includes('2727'));
    assert.ok(text.includes('info@reg.rw'));
    assert.ok(text.includes('KN82 ST3, Nyarugenge, Kigali'));
  });

  it('calls the hotline through tel:2727', () => {
    assert.equal(content.HOTLINE_HREF, 'tel:2727');
    assert.equal(content.HOTLINE_TEXT, 'Real fault? Call 2727');
  });
});
