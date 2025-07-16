import type { RangeMode } from '../types'
import semver from 'semver'

export function getVersionRangePrefix(v: string) {
  const leadings = ['>=', '<=', '>', '<', '~', '^']
  const ver = v.trim()

  if (ver === '*' || ver === '')
    return '*'
  if (ver[0] === '~' || ver[0] === '^')
    return ver[0]
  for (const leading of leadings) {
    if (ver.startsWith(leading))
      return leading
  }
  if (ver.includes('x')) {
    const parts = ver.split('.')
    if (parts[0] === 'x')
      return '*'
    if (parts[1] === 'x')
      return '^'
    if (parts[2] === 'x')
      return '~'
  }
  if (+ver[0] < 10)
    return ''
  return null
}

export function changeVersionRange(version: string, mode: Exclude<RangeMode, 'latest' | 'newest' | 'next'>) {
  if (!semver.validRange(version))
    return null

  if (mode === 'default')
    return version

  const min = semver.minVersion(version)
  if (!min)
    return null

  return {
    major: '>=',
    minor: '^',
    patch: '~',
  }[mode] + min
}

export function applyVersionRangePrefix(version: string | null, prefix: string | null) {
  if (version == null || prefix == null)
    return null

  if (prefix === '*')
    return '*'

  return prefix + version
}

export function getPrefixedVersion(current: string, target: string) {
  const prefix = getVersionRangePrefix(current)
  return applyVersionRangePrefix(
    target,
    prefix,
  )
}

export function getMaxSatisfying(versions: string[], current: string, mode: RangeMode, tags: Record<string, string>, includePrerelease = false): string | undefined {
  let version = null

  if (mode === 'latest') {
    version = tags.latest
  }
  else if (mode === 'newest') {
    version = versions[versions.length - 1]
  }
  else if (mode === 'next') {
    version = tags.next
  }
  else if (mode === 'default' && (current === '*' || current.trim() === '')) {
    return
  }
  else {
    const range = changeVersionRange(current, mode)
    if (!range)
      throw new Error('invalid_range')

    let maxVersion: string | null = tags.latest
    if (!semver.satisfies(maxVersion, range, { includePrerelease }))
      maxVersion = null

    // Find all versions that satisfy the range
    const satisfyingVersions = versions.filter(ver => 
      semver.satisfies(ver, range, { includePrerelease })
    )

    if (!satisfyingVersions.length)
      return

    // In default mode with latest constraint, only consider versions <= latest
    let candidateVersions = satisfyingVersions
    if (maxVersion && mode === 'default') {
      candidateVersions = satisfyingVersions.filter(ver => semver.lte(ver, maxVersion!))
    }

    // When prerelease is enabled and not in default mode, prefer prereleases over stable
    if (includePrerelease && mode !== 'default') {
      const prereleases = candidateVersions.filter(ver => semver.prerelease(ver))
      if (prereleases.length > 0) {
        // Use the highest prerelease
        version = prereleases[prereleases.length - 1]
      } else {
        // No prereleases, use the highest stable
        version = candidateVersions[candidateVersions.length - 1]
      }
    } else {
      // Default behavior: use the highest version (prerelease or stable)
      version = candidateVersions[candidateVersions.length - 1]
    }
  }

  if (!version)
    return

  return version
}
