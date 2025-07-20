import { expect, it } from 'vitest'
import { getMaxSatisfying } from '../src/utils/versions'

it('prerelease functionality comprehensive test', () => {
  // Test scenario: React-like package with prereleases
  const reactVersions = [
    '18.0.0',
    '18.1.0',
    '18.2.0',
    '18.3.0-canary.1',
    '18.3.0-rc.0',
    '18.3.0-rc.1',
    '19.0.0-beta.1',
    '19.0.0-beta.2',
  ]
  const reactTags = { latest: '18.2.0', next: '19.0.0-beta.2', canary: '18.3.0-canary.1' }

  // Test default behavior (no prereleases)
  expect(getMaxSatisfying(reactVersions, '^18.0.0', 'default', reactTags, false)).toBe('18.2.0')
  expect(getMaxSatisfying(reactVersions, '^18.0.0', 'minor', reactTags, false)).toBe('18.2.0')
  expect(getMaxSatisfying(reactVersions, '^18.0.0', 'major', reactTags, false)).toBe('18.2.0')

  // Test with prerelease enabled
  // - default mode respects latest tag but includes prereleases <= latest (none in this case)
  expect(getMaxSatisfying(reactVersions, '^18.0.0', 'default', reactTags, true)).toBe('18.2.0')
  // - minor mode allows going beyond latest to find prereleases
  expect(getMaxSatisfying(reactVersions, '^18.0.0', 'minor', reactTags, true)).toBe('18.3.0-rc.1')

  // Test alpha/beta/rc preference (should pick the "highest" prerelease)
  const testVersions = [
    '1.0.0',
    '1.1.0',
    '1.2.0-alpha.1',
    '1.2.0-alpha.2',
    '1.2.0-beta.1',
    '1.2.0-rc.1',
    '1.2.0-rc.2',
  ]
  const testTags = { latest: '1.1.0' }

  // Should pick rc.2 as it's the highest prerelease
  expect(getMaxSatisfying(testVersions, '^1.0.0', 'minor', testTags, true)).toBe('1.2.0-rc.2')

  // Test case where we need to go beyond latest because no prereleases within constraint
  const noPreWithinLatest = ['1.0.0', '1.1.0', '1.3.0-alpha.1', '2.0.0']
  const tagsNoPreWithin = { latest: '1.1.0' }
  expect(getMaxSatisfying(noPreWithinLatest, '^1.0.0', 'minor', tagsNoPreWithin, true)).toBe('1.3.0-alpha.1')
})
