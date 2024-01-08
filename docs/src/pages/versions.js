/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import Layout from '@theme/Layout';

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';

import pkg from '../../../packages/core/package.json';
import versions from '../../versions.json';

function Version() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  const latestVersion = [versions[0], pkg.version];
  const pastVersions = versions.filter(version => version !== versions[0]).map(v => [v, v + '.0']);
  const repoUrl = `https://github.com/${siteConfig.organizationName}/${siteConfig.projectName}`;
  const link = (to, version) => {
    const useQuickStart = ['next', 'latest'].includes(version) || +version >= 6;
    return useBaseUrl(to + '/' + (useQuickStart ? 'quick-start' : 'installation'));
  }

  return (
    <Layout
      permalink='/versions'
      description='MikroORM Versions page listing all documented site versions'>
      <div className='container margin-vert--xl'>
        <h1>MikroORM documentation versions</h1>
        <div className='margin-bottom--lg'>
          <h3 id='latest'>Latest version (Stable)</h3>
          <p>Here you can find the latest documentation.</p>
          <table>
            <tbody>
            <tr>
              <th>{latestVersion[1]}</th>
              <td>
                <Link to={link('/docs', 'latest')}>
                  Documentation
                </Link>
              </td>
              <td>
                <a href={`${repoUrl}/releases/tag/v${latestVersion[1]}`}>
                  Release Notes
                </a>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div className='margin-bottom--lg'>
          <h3 id='next'>Next version (Unreleased)</h3>
          <p>Here you can find the documentation for unreleased version.</p>
          <table>
            <tbody>
            <tr>
              <th>master</th>
              <td>
                <Link to={link('/docs/next', 'next')}>
                  Documentation
                </Link>
              </td>
              <td>
                <a href={repoUrl}>Source Code</a>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        {pastVersions.length > 0 && (
          <div className='margin-bottom--lg'>
            <h3 id='archive'>Past Versions</h3>
            <p>
              Here you can find documentation for previous versions of MikroORM.
            </p>
            <table>
              <tbody>
              {pastVersions.map(version => (
                <tr key={version[0]}>
                  <th>{version[0]}</th>
                  <td>
                    <Link to={link(`/docs/${version[0]}`, version[0])}>
                      Documentation
                    </Link>
                  </td>
                  <td>
                    <a href={`${repoUrl}/releases/tag/v${version[1]}`}>
                      Release Notes
                    </a>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Version;
