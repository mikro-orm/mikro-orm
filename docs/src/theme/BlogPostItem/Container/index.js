import React from 'react';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import Giscus from '@giscus/react';
import { useColorMode } from '@docusaurus/theme-common';

export default function BlogPostItemContainer({ children, className, list }) {
  const {
    frontMatter,
    assets,
    metadata: { description },
  } = useBlogPost();
  const { colorMode } = useColorMode();
  const { withBaseUrl } = useBaseUrlUtils();
  const image = assets.image ?? frontMatter.image;
  const keywords = frontMatter.keywords ?? [];
  return (
    <>
      <article
        className={className}
        itemProp='blogPost'
        itemScope
        itemType='https://schema.org/BlogPosting'>
        {description && <meta itemProp='description' content={description} />}
        {image && (
          <link itemProp='image' href={withBaseUrl(image, { absolute: true })} />
        )}
        {keywords.length > 0 && (
          <meta itemProp='keywords' content={keywords.join(',')} />
        )}
        {children}
      </article>
      {!list && <Giscus
        id='giscus-comments'
        repo='mikro-orm/mikro-orm'
        repoId='MDEwOlJlcG9zaXRvcnkxMjUzNDIwNjQ='
        category='Comments'
        categoryId='DIC_kwDOB3iRcM4CcQyL'
        mapping='pathname'
        reactionsEnabled='1'
        emitMetadata='0'
        inputPosition='top'
        theme={colorMode}
        lang='en'
        strict='1'
      />}
    </>
  );
}
