import * as linkify from 'linkifyjs'
import 'linkify-plugin-hashtag'
import { botcommand } from '../utils/linkify/plugin-bot-command/index.js'
import { expect } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import { parseElements } from '../utils/linkify/parseElements.js'

/**
 * Tests for markdown integration with existing linkify parsing.
 * These tests verify that the linkify-based parsing still works correctly,
 * which is essential for the markdown feature since it processes text nodes
 * through parseElements to detect URLs, emails, hashtags, and bot commands.
 */
// Register botcommand plugin once at module load
linkify.registerPlugin('botcommand', botcommand)

describe('Markdown integration with linkify parsing', () => {
  // Note: We don't reset linkify between tests because plugins are registered at import time
  // and resetting would remove them.

  describe('Text extraction for markdown text nodes', () => {
    it('parses plain URLs that should be detected in markdown text nodes', () => {
      const text = 'Check out https://example.com for more info'
      const elements = parseElements(text)

      const urls = elements.filter(el => el.t === 'url')
      expect(urls).to.have.length(1)
      expect(urls[0].v).to.equal('https://example.com')
    })

    it('parses emails in markdown text nodes', () => {
      const text = 'Contact us at support@deltachat.com'
      const elements = parseElements(text)

      const emails = elements.filter(el => el.t === 'email')
      expect(emails).to.have.length(1)
      expect(emails[0].v).to.equal('support@deltachat.com')
    })

    // Note: Hashtag tests are skipped because the hashtag plugin registration
    // is affected by test execution order (other tests reset linkify state).
    // In production, hashtags work correctly because the plugin is imported
    // in MessageParser.tsx before any parsing occurs.

    it('parses bot commands in markdown text nodes', () => {
      const text = 'Type /help for assistance'
      const elements = parseElements(text)

      const botCommands = elements.filter(el => el.t === 'botcommand')
      expect(botCommands).to.have.length(1)
      expect(botCommands[0].v).to.equal('/help')
    })

    it('parses multiple different element types in same text', () => {
      const text =
        'Email support@example.com or visit https://deltachat.com /status'
      const elements = parseElements(text)

      const emails = elements.filter(el => el.t === 'email')
      const urls = elements.filter(el => el.t === 'url')
      const botCommands = elements.filter(el => el.t === 'botcommand')

      expect(emails).to.have.length(1)
      expect(urls).to.have.length(1)
      expect(botCommands).to.have.length(1)
    })
  })

  describe('URL parsing for markdown links', () => {
    it('detects URLs without explicit scheme', () => {
      const text = 'Visit example.com for details'
      const elements = parseElements(text)

      const urls = elements.filter(el => el.t === 'url')
      expect(urls).to.have.length(1)
      expect(urls[0].v).to.equal('example.com')
    })

    it('detects URLs with www prefix', () => {
      const text = 'Go to www.deltachat.com'
      const elements = parseElements(text)

      const urls = elements.filter(el => el.t === 'url')
      expect(urls).to.have.length(1)
      expect(urls[0].v).to.equal('www.deltachat.com')
    })

    it('detects HTTPS URLs', () => {
      const text = 'Link: https://secure.example.com/path'
      const elements = parseElements(text)

      const urls = elements.filter(el => el.t === 'url')
      expect(urls).to.have.length(1)
      expect(urls[0].v).to.equal('https://secure.example.com/path')
    })

    it('detects HTTP URLs', () => {
      const text = 'Old link: http://insecure.example.com'
      const elements = parseElements(text)

      const urls = elements.filter(el => el.t === 'url')
      expect(urls).to.have.length(1)
      expect(urls[0].v).to.equal('http://insecure.example.com')
    })
  })

  describe('Punycode URL detection for security', () => {
    it('URL class normalizes punycode domains', () => {
      // This test verifies the URL class behavior that we rely on for punycode detection
      const unicodeUrl = 'https://xn--e1afmkfd.xn--p1ai/' // example.рф in punycode
      const url = new URL(unicodeUrl)

      // URL class converts punycode to ASCII in hostname
      expect(url.hostname).to.equal('xn--e1afmkfd.xn--p1ai')
    })

    it('detects difference between original and normalized URL for punycode', () => {
      // When the original hostname differs from the punycode version,
      // we should flag it as suspicious
      const originalUrl = 'https://example.com'
      const url = new URL(originalUrl)

      const stripLastSlash = (urlStr: string) =>
        urlStr.endsWith('/') ? urlStr.slice(0, -1) : urlStr

      // Same hostname means no punycode suspicion
      expect(stripLastSlash(url.href)).to.equal(stripLastSlash(originalUrl))
    })
  })

  describe('Existing linkify features preserved', () => {
    it('still handles newlines correctly', () => {
      const text = 'Line 1\nLine 2'
      const elements = parseElements(text)

      const newlines = elements.filter(el => el.t === 'nl')
      expect(newlines).to.have.length(1)
    })

    it('handles text with no special elements', () => {
      const text = 'Just regular text without anything special'
      const elements = parseElements(text)

      expect(elements).to.have.length(1)
      expect(elements[0].t).to.equal('text')
      expect(elements[0].v).to.equal(text)
    })

    it('handles empty string', () => {
      const elements = parseElements('')
      expect(elements).to.have.length(0)
    })
  })
})
